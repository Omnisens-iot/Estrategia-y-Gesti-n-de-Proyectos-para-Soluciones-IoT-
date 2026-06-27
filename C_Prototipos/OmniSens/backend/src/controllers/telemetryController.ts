import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';

interface TelemetryParams {
  deviceId: string;
}

interface TelemetryQuery {
  days?: string;
}

export const getHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;
  const { deviceId } = request.params as TelemetryParams;
  const { days } = request.query as TelemetryQuery;
  const daysParsed = parseInt(days || '1', 10); // Por defecto 1 día (24 horas)
  
  // Limitar consulta a un máximo de 365 días para proteger la BD
  const safeDays = Math.min(Math.max(daysParsed, 1), 365);

  try {
    // 1. Validar que el dispositivo le pertenezca al cliente y no esté borrado lógicamente
    const device = await db.selectFrom('devices')
      .select('device_id')
      .where('device_id', '=', deviceId)
      .where('client_id', '=', clientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!device) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado o acceso denegado' });
    }

    // 2. Calcular la fecha límite hacia atrás
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeDays);

    let history;

    if (safeDays <= 1) {
      // Para periodos cortos (24hs o menos), usar datos en vivo (crudos)
      history = await db.selectFrom('air_quality_data')
        .select([
          'time as bucket',
          'device_id',
          'pm25 as avg_pm25',
          'pm10 as avg_pm10',
          'co2 as avg_co2',
          'temp as avg_temp',
          'hum as avg_hum',
          'pres as avg_pres',
          'l as avg_l',
          'lux as avg_lux',
          'battery as avg_battery'
        ])
        .where('device_id', '=', deviceId)
        .where('time', '>=', cutoffDate)
        .orderBy('time', 'asc')
        .execute();
    } else {
      // Para periodos largos, consultar la VISTA MATERIALIZADA (aqi_hourly_avg)
      history = await db.selectFrom('aqi_hourly_avg')
        .selectAll()
        .where('device_id', '=', deviceId)
        .where('bucket', '>=', cutoffDate)
        .orderBy('bucket', 'asc') // Orden cronológico para gráficos
        .execute();
    }

    reply.send(history);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error interno obteniendo historial' });
  }
};

export const getNow = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;
  const { deviceId } = request.params as TelemetryParams;

  try {
    // 1. Obtener el dato más reciente directamente de la vista multi-tenant
    // La vista ya se encarga de excluir los devices con deleted_at IS NOT NULL
    const latestData = await db.selectFrom('vw_telemetry_by_client') // Asumiendo que agregaremos esto a db.ts si es necesario, o usamos sql raw si no está en interface
      .selectAll()
      .where('device_id', '=', deviceId)
      .where('client_id', '=', clientId)
      .orderBy('time', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!latestData) {
      return reply.status(404).send({ error: 'No hay datos recientes o el dispositivo no existe/pertenece al cliente' });
    }

    reply.send(latestData);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error interno obteniendo el estado actual' });
  }
};

export const getRawTelemetry = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;
  const { deviceId } = request.params as TelemetryParams;

  try {
    // 1. Validar que el dispositivo le pertenezca al cliente
    const device = await db.selectFrom('devices')
      .select('device_id')
      .where('device_id', '=', deviceId)
      .where('client_id', '=', clientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!device) {
      return reply.status(404).send({ error: 'Dispositivo no encontrado o acceso denegado' });
    }

    // 2. Obtener las últimas 50 filas crudas ordenadas por tiempo descendente
    const rawData = await db.selectFrom('air_quality_data')
      .selectAll()
      .where('device_id', '=', deviceId)
      .orderBy('time', 'desc')
      .limit(50)
      .execute();

    return reply.send(rawData);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error interno obteniendo telemetría cruda' });
  }
};
