import * as mqtt from 'mqtt';
import * as crypto from 'crypto';
import { db } from '../config/db';
import { sendTelegramAlert } from './telegramBot';
import { sendWebPushToClient } from './webpush';
let mqttClient: mqtt.MqttClient | null = null;

interface RuleState {
  isTriggered: boolean;
  lastTriggeredValue: number;
}
const ruleStates = new Map<string, RuleState>();

async function sendSystemAlert(deviceId: string, alertType: string, msg: string, force: boolean = false) {
  try {
    // 1. Obtener Chat ID de administrador. Usamos el primer Chat ID registrado en device_rules si no hay variable de entorno.
    const rule = await db.selectFrom('device_rules').select('chat_id').where('chat_id', 'is not', null).executeTakeFirst();
    const chatId = process.env.ADMIN_CHAT_ID || (rule ? rule.chat_id : null);
    
    if (!chatId) return;

    // 2. Controlar Rate-Limiting (12 horas)
    const log = await db.selectFrom('system_alerts_log')
      .selectAll()
      .where('device_id', '=', deviceId)
      .where('alert_type', '=', alertType)
      .executeTakeFirst();

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    if (force || !log || log.last_sent_at < twelveHoursAgo) {
      sendTelegramAlert(chatId, msg);
      
      if (log) {
        await db.updateTable('system_alerts_log')
          .set({ last_sent_at: new Date() })
          .where('device_id', '=', deviceId)
          .where('alert_type', '=', alertType)
          .execute();
      } else {
        await db.insertInto('system_alerts_log')
          .values({ device_id: deviceId, alert_type: alertType, last_sent_at: new Date() })
          .execute();
      }
    }
  } catch (e) {
    console.error('Error enviando alerta de sistema:', e);
  }
}

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

    // Suscribirse a eventos de conexión/desconexión del broker EMQX
    mqttClient?.subscribe('$SYS/brokers/+/clients/+/disconnected', (err) => {
      if (err) console.error('❌ Error al suscribirse a eventos de desconexión', err);
      else console.log('📡 Suscrito a eventos de desconexión de clientes ($SYS)');
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      // ----------------------------------------------------------------------
      // Flujo de Eventos de Sistema (Desconexiones)
      // ----------------------------------------------------------------------
      if (topic.startsWith('$SYS/') && topic.endsWith('/disconnected')) {
        const parts = topic.split('/');
        const clientId = parts[4]; // $SYS/brokers/{node}/clients/{clientid}/disconnected
        if (clientId) {
          const device = await db.selectFrom('devices').select('device_id').where('device_id', '=', clientId).executeTakeFirst();
          if (device) {
            await db.updateTable('devices').set({ status: 'offline' }).where('device_id', '=', device.device_id).execute();
            await sendSystemAlert(device.device_id, 'disconnected', `🚨 *Alerta de Sistema*\nEl dispositivo \`${device.device_id}\` se ha desconectado de la red.`);
          }
        }
        return;
      }

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
          .select(['device_id', 'client_id'])
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

          // Verificar eventos de hardware críticos para notificaciones de sistema
          const battery = payload.battery !== undefined ? payload.battery : (payload.bat !== undefined ? payload.bat : null);
          if (battery !== null && battery < 20) {
            await sendSystemAlert(actualDeviceId, 'battery', `🔋 *Alerta de Sistema*\nEl dispositivo \`${actualDeviceId}\` reporta batería baja (${battery}%).`);
          }
          if (payload.pm10 === -1.0 || payload.temp === -1.0) {
            await sendSystemAlert(actualDeviceId, 'sensor_error', `🛠️ *Alerta de Sistema*\nEl dispositivo \`${actualDeviceId}\` reporta falla de hardware o sensor.`);
          }

          // ----------------------------------------------------------------------
          // Evaluación de Reglas (Triggers) para Alertas de Telegram
          // ----------------------------------------------------------------------
          try {
            const rules = await db.selectFrom('device_rules')
              .selectAll()
              .where('device_id', '=', actualDeviceId)
              .execute();

            for (const rule of rules) {
              const ruleCondition = rule.condition || '>';
              
              const value = payload[rule.metric];
              if (value === undefined || value === null) continue;
              
              let conditionMet = false;
              if (ruleCondition === '>' && value > rule.threshold) conditionMet = true;
              else if (ruleCondition === '<' && value < rule.threshold) conditionMet = true;
              else if (ruleCondition === '==' && value == rule.threshold) conditionMet = true;
              else if (ruleCondition === '>=' && value >= rule.threshold) conditionMet = true;
              else if (ruleCondition === '<=' && value <= rule.threshold) conditionMet = true;
              
              console.log(`🔔 Evaluando regla [${rule.metric} ${ruleCondition} ${rule.threshold}]: Valor actual = ${value} -> Cumple condición: ${conditionMet}`);
              
              const stateKey = `${actualDeviceId}_${rule.metric}`;
              const currentState = ruleStates.get(stateKey) || { isTriggered: false, lastTriggeredValue: 0 };
              
              if (conditionMet) {
                let shouldNotify = false;
                
                if (!currentState.isTriggered) {
                  // Cambio de estado: Normal -> Alarma
                  shouldNotify = true;
                } else {
                  // Ya estaba en alarma, verificar el Delta (10% de cambio)
                  const delta = Math.abs(value - currentState.lastTriggeredValue);
                  // 10% del último valor, o al menos un cambio mínimo si el valor es muy pequeño
                  const requiredDelta = Math.max(Math.abs(currentState.lastTriggeredValue * 0.10), 1.0); 
                  if (delta >= requiredDelta) {
                    shouldNotify = true;
                  }
                }
                
                if (shouldNotify) {
                  // Actualizar estado
                  ruleStates.set(stateKey, { isTriggered: true, lastTriggeredValue: value });
                  
                  // Notificación Web Push para el Cliente
                  if (device && device.client_id) {
                    const pushPayload = {
                      title: '⚠️ Alerta OmniSens',
                      body: `El dispositivo ${actualDeviceId} superó el umbral de ${rule.metric} (Valor: ${value}).`,
                      icon: '/pwa-192x192.png'
                    };
                    sendWebPushToClient(device.client_id, pushPayload);
                  }
                  
                  // Notificación Telegram (usando force=true para evadir el rate limit de 12hs, ya que la logica de estado y delta se encarga del antispam)
                  await sendSystemAlert(actualDeviceId, `rule_${rule.metric}`, `⚠️ *Alerta OmniSens*\nEl dispositivo \`${actualDeviceId}\` superó el umbral de ${rule.metric} (Valor: ${value}).`, true);
                }
              } else {
                // La condición ya no se cumple
                if (currentState.isTriggered) {
                  // Cambio de estado: Alarma -> Normal (Recuperación)
                  ruleStates.set(stateKey, { isTriggered: false, lastTriggeredValue: value });
                  
                  // Enviar Notificación de Recuperación
                  if (device && device.client_id) {
                    const pushPayload = {
                      title: '✅ Alerta Resuelta',
                      body: `El parámetro ${rule.metric} en ${actualDeviceId} volvió a la normalidad (Valor: ${value}).`,
                      icon: '/pwa-192x192.png'
                    };
                    sendWebPushToClient(device.client_id, pushPayload);
                  }
                  await sendSystemAlert(actualDeviceId, `rule_${rule.metric}_recovered`, `✅ *Alerta Resuelta*\nEl parámetro ${rule.metric} en \`${actualDeviceId}\` volvió a la normalidad (Valor: ${value}).`, true);
                }
              }
            }
          } catch (e) {
            console.error('Error evaluando reglas de Telegram:', e);
          }
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
