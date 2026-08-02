import { db } from '../config/db';
import { sendTelegramAlert } from './telegramBot';

export async function sendNodeHealthReport() {
  try {
    const chatId = process.env.ADMIN_CHAT_ID;
    if (!chatId) {
      console.log('⚠️ No ADMIN_CHAT_ID configurado para reporte de salud.');
      return;
    }

    // Obtener todos los dispositivos activos
    const devices = await db.selectFrom('devices')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute();

    if (devices.length === 0) return;

    const nodeReports = [];

    for (const dev of devices) {
      // Obtener la última lectura de telemetría de cada dispositivo
      const latestTelemetry = await db.selectFrom('air_quality_data')
        .selectAll()
        .where('device_id', '=', dev.device_id)
        .orderBy('time', 'desc')
        .executeTakeFirst();

      // Obtener cantidad de reglas activas
      const rules = await db.selectFrom('device_rules')
        .select('rule_id')
        .where('device_id', '=', dev.device_id)
        .execute();

      nodeReports.push({
        device_id: dev.device_id,
        name: dev.device_name || dev.device_id,
        status: dev.status,
        last_connection: dev.last_connection ? dev.last_connection.toISOString() : null,
        health: {
          battery_pct: latestTelemetry?.battery ?? null,
          wifi_rssi_l: latestTelemetry?.l ?? null,
          sensors: {
            mq135_raw: latestTelemetry?.co2 ?? null,
            temp_c: latestTelemetry?.temp ?? null,
            humidity_pct: latestTelemetry?.hum ?? null,
            pressure_hpa: latestTelemetry?.pres ?? null,
            lux: latestTelemetry?.lux ?? null,
            pm25: latestTelemetry?.pm25 ?? null,
            pm10: latestTelemetry?.pm10 ?? null
          },
          actuators: {
            r1: latestTelemetry?.r1 === 1 ? 'ON' : 'OFF',
            r2: latestTelemetry?.r2 === 1 ? 'ON' : 'OFF',
            pwm: latestTelemetry?.pwm ?? 0
          }
        },
        active_rules_count: rules.length
      });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      report_type: 'node_health_summary',
      devices_count: nodeReports.length,
      nodes: nodeReports
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const message = `📊 *Reporte de Salud de Nodos (Hourly)*\n\`\`\`json\n${jsonString}\n\`\`\``;

    await sendTelegramAlert(chatId, message);
    console.log('✅ Reporte horario de salud enviado por Telegram.');
  } catch (error) {
    console.error('❌ Error generando o enviando reporte de salud:', error);
  }
}

export function startHealthReportScheduler() {
  // Primer envío tras 10 segundos del inicio del servidor
  setTimeout(() => {
    sendNodeHealthReport();
  }, 10000);

  // Repetición cada 1 hora (3.600.000 ms)
  setInterval(() => {
    sendNodeHealthReport();
  }, 60 * 60 * 1000);

  console.log('⏰ Planificador de reportes horarios de salud de Telegram activado.');
}
