"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportTelemetry = exports.getRawTelemetry = exports.getNow = exports.getHistory = void 0;
const db_1 = require("../config/db");
const json2csv_1 = require("json2csv");
const pdfkit_1 = __importDefault(require("pdfkit"));
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
        let history;
        if (safeDays <= 1) {
            // Para periodos cortos (24hs o menos), usar datos en vivo (crudos)
            history = await db_1.db.selectFrom('air_quality_data')
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
        }
        else {
            // Para periodos largos, consultar la VISTA MATERIALIZADA (aqi_hourly_avg)
            history = await db_1.db.selectFrom('aqi_hourly_avg')
                .selectAll()
                .where('device_id', '=', deviceId)
                .where('bucket', '>=', cutoffDate)
                .orderBy('bucket', 'asc') // Orden cronológico para gráficos
                .execute();
        }
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
        return reply.status(500).send({ error: 'Error interno obteniendo el estado actual' });
    }
};
exports.getNow = getNow;
const getRawTelemetry = async (request, reply) => {
    const clientId = request.user.client_id;
    const { deviceId } = request.params;
    try {
        // 1. Validar que el dispositivo le pertenezca al cliente
        const device = await db_1.db.selectFrom('devices')
            .select('device_id')
            .where('device_id', '=', deviceId)
            .where('client_id', '=', clientId)
            .where('deleted_at', 'is', null)
            .executeTakeFirst();
        if (!device) {
            return reply.status(404).send({ error: 'Dispositivo no encontrado o acceso denegado' });
        }
        // 2. Obtener las últimas 50 filas crudas ordenadas por tiempo descendente
        const rawData = await db_1.db.selectFrom('air_quality_data')
            .selectAll()
            .where('device_id', '=', deviceId)
            .orderBy('time', 'desc')
            .limit(50)
            .execute();
        return reply.send(rawData);
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Error interno obteniendo telemetría cruda' });
    }
};
exports.getRawTelemetry = getRawTelemetry;
const exportTelemetry = async (request, reply) => {
    const clientId = request.user.client_id;
    const { deviceId } = request.params;
    const { startDate, endDate, format } = request.query;
    try {
        const device = await db_1.db.selectFrom('devices')
            .select('device_id')
            .where('device_id', '=', deviceId)
            .where('client_id', '=', clientId)
            .where('deleted_at', 'is', null)
            .executeTakeFirst();
        if (!device)
            return reply.status(404).send({ error: 'Dispositivo no encontrado o acceso denegado' });
        const data = await db_1.db.selectFrom('air_quality_data')
            .selectAll()
            .where('device_id', '=', deviceId)
            .where('time', '>=', new Date(startDate))
            .where('time', '<=', new Date(endDate))
            .orderBy('time', 'asc')
            .execute();
        if (format === 'csv') {
            const json2csvParser = new json2csv_1.Parser();
            const csv = json2csvParser.parse(data);
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="export_${deviceId}.csv"`);
            return reply.send(csv);
        }
        else if (format === 'pdf') {
            const doc = new pdfkit_1.default();
            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="export_${deviceId}.pdf"`);
            doc.pipe(reply.raw);
            doc.fontSize(20).text('Reporte de Telemetría OmniSens', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Dispositivo: ${deviceId}`);
            doc.text(`Rango: ${startDate} al ${endDate}`);
            doc.text(`Registros exportados: ${data.length}`);
            doc.moveDown();
            data.forEach((row, i) => {
                if (i < 200) { // Limit to 200 lines to avoid massive PDFs
                    doc.fontSize(10).text(`${row.time.toISOString()} | Temp: ${row.temp}°C | Hum: ${row.hum}% | PM2.5: ${row.pm25} | Lux: ${row.lux}`);
                }
            });
            if (data.length > 200)
                doc.fontSize(10).text('... (exportación PDF limitada a 200 registros. Use CSV para el reporte completo)');
            doc.end();
            return reply; // Fastify automatically handles the raw stream via pipe when returning reply
        }
        else {
            return reply.status(400).send({ error: 'Formato no soportado. Use csv o pdf' });
        }
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno en la exportación' });
    }
};
exports.exportTelemetry = exportTelemetry;
