"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNow = exports.getHistory = void 0;
const db_1 = require("../config/db");
const getHistory = async (request, reply) => {
    const clientId = request.user.client_id;
    const { deviceId } = request.params;
    const { days } = request.query;
    const daysParsed = parseInt(days || '1', 10); // Por defecto 1 día (24 horas)
    // Limitar consulta a un máximo de 365 días para proteger la BD
    const safeDays = Math.min(Math.max(daysParsed, 1), 365);
    try {
        // 1. Validar que el dispositivo le pertenezca al cliente y no esté borrado lógicamente
        const device = await db_1.db.selectFrom('devices')
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
        // 3. Consultar la VISTA MATERIALIZADA (aqi_hourly_avg)
        // OBLIGATORIO: Evitar usar air_quality_data para periodos largos.
        const history = await db_1.db.selectFrom('aqi_hourly_avg')
            .selectAll()
            .where('device_id', '=', deviceId)
            .where('bucket', '>=', cutoffDate)
            .orderBy('bucket', 'asc') // Orden cronológico para gráficos
            .execute();
        reply.send(history);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno obteniendo historial' });
    }
};
exports.getHistory = getHistory;
const getNow = async (request, reply) => {
    const clientId = request.user.client_id;
    const { deviceId } = request.params;
    try {
        // 1. Obtener el dato más reciente directamente de la vista multi-tenant
        // La vista ya se encarga de excluir los devices con deleted_at IS NOT NULL
        const latestData = await db_1.db.selectFrom('vw_telemetry_by_client') // Asumiendo que agregaremos esto a db.ts si es necesario, o usamos sql raw si no está en interface
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
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno obteniendo estado actual' });
    }
};
exports.getNow = getNow;
