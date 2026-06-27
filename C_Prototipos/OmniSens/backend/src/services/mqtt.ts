import * as mqtt from 'mqtt';
import * as crypto from 'crypto';
import { db } from '../config/db';

let mqttClient: mqtt.MqttClient | null = null;

export function setupMqttSubscriber() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'; 
  // Nota: Para producción MQTTS, usar mqtts:// y proveer opciones TLS (ca, cert, key)

  mqttClient = mqtt.connect(brokerUrl, {
    username: process.env.MQTT_USERNAME || 'backend_service',
    password: process.env.MQTT_PASSWORD || 'backend_pass'
  });

  mqttClient.on('connect', () => {
    console.log('✅ Backend conectado al Broker MQTT exitosamente');
    
    // Suscribirse a la telemetría de todos los dispositivos
    mqttClient?.subscribe('aqi/telemetry/+/data', (err) => {
      if (err) console.error('❌ Error al suscribirse al tópico de telemetría', err);
      else console.log('📡 Suscrito a aqi/telemetry/+/data');
    });

    // Suscribirse a solicitudes de aprovisionamiento por MQTT (Optimización Hardware)
    mqttClient?.subscribe('aqi/provisioning/request', (err) => {
      if (err) console.error('❌ Error al suscribirse al tópico de aprovisionamiento', err);
      else console.log('📡 Suscrito a aqi/provisioning/request');
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      // ----------------------------------------------------------------------
      // Flujo de Aprovisionamiento Seguro por MQTT
      // ----------------------------------------------------------------------
      if (topic === 'aqi/provisioning/request') {
        const payload = JSON.parse(message.toString());
        const { mac_address, timestamp } = payload;
        
        if (!mac_address || !timestamp) return;

        const normalizedMac = mac_address.toUpperCase().replace(/:/g, '');

        // Verificar que el dispositivo exista y no esté borrado
        const device = await db.selectFrom('devices')
          .selectAll()
          .where('mac_address', '=', normalizedMac)
          .where('deleted_at', 'is', null) // OBLIGATORIO: Ignorar si fue borrado lógicamente
          .executeTakeFirst();

        if (device) {
          // Generar hash criptográfico
          const hmacHash = crypto
            .createHmac('sha256', device.hmac_secret)
            .update(timestamp.toString())
            .digest('hex');

          // Devolver el token por un tópico específico de esta MAC
          const responsePayload = {
            device_id: device.device_id,
            mqtt_username: device.device_id,
            mqtt_password: hmacHash,
            topic_publish: `aqi/telemetry/${device.device_id}/data`
          };

          mqttClient?.publish(
            `aqi/provisioning/response/${mac_address}`, 
            JSON.stringify(responsePayload),
            { qos: 1 } // Garantizar entrega
          );
          
          console.log(`🔐 Aprovisionamiento resuelto por MQTT para MAC: ${mac_address}`);
        } else {
          console.warn(`⚠️ Intento de aprovisionamiento fallido. MAC ${mac_address} no registrada.`);
        }
        return;
      }

      // ----------------------------------------------------------------------
      // Flujo de Ingesta de Telemetría
      // ----------------------------------------------------------------------
      if (topic.startsWith('aqi/telemetry/')) {
        const topicParts = topic.split('/');
        const identifier = topicParts[2];
        if (!identifier) return;

        // Traducir el identifier (puede ser la MAC address) al device_id real
        const device = await db.selectFrom('devices')
          .select('device_id')
          .where('mac_address', '=', identifier.toUpperCase().replace(/:/g, ''))
          .executeTakeFirst();
          
        const actualDeviceId = device ? device.device_id : identifier;
        
        const payload = JSON.parse(message.toString());
        
        // Validar payload mínimo (Security by Design: Evitar inserts corruptos)
        if (payload.pm10 !== undefined || payload.temp !== undefined || payload.lux !== undefined || payload.l !== undefined) {
          await db.insertInto('air_quality_data')
            .values({
              time: new Date(),
              device_id: actualDeviceId,
              pm25: payload.pm25 !== undefined ? payload.pm25 : -1.0,
              pm10: payload.pm10 !== undefined ? payload.pm10 : -1.0,
              co2: payload.co2 !== undefined ? payload.co2 : null,
              temp: payload.temp !== undefined ? payload.temp : null,
              hum: payload.hum !== undefined ? payload.hum : null,
              pres: payload.pres !== undefined ? payload.pres : null,
              l: payload.l !== undefined ? payload.l : null,
              lux: payload.lux !== undefined ? payload.lux : null,
              battery: payload.battery !== undefined ? payload.battery : (payload.bat !== undefined ? payload.bat : null),
              r1: payload.r1 !== undefined ? payload.r1 : null,
              r2: payload.r2 !== undefined ? payload.r2 : null,
              pwm: payload.pwm !== undefined ? payload.pwm : null
            })
            .execute();
            
          // Marcar el dispositivo como activo y actualizar última conexión
          await db.updateTable('devices')
            .set({ status: 'active', last_connection: new Date() })
            .where('device_id', '=', actualDeviceId)
            .execute();
          
          console.log(`💾 Telemetría guardada para dispositivo: ${actualDeviceId} (desde tópico MAC: ${identifier})`);
        } else {
          console.warn(`⚠️ Payload incompleto descartado para dispositivo: ${actualDeviceId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje MQTT:', error);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ Error fatal en cliente MQTT:', err);
  });
}

export function publishCommand(deviceId: string, commandType: string, payload: any) {
  if (!mqttClient || !mqttClient.connected) {
    throw new Error('MQTT client not connected');
  }
  const topic = `aqi/commands/${deviceId}/${commandType}`;
  mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
  console.log(`📤 Comando [${commandType}] enviado a dispositivo ${deviceId}`);
}
