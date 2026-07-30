import { FastifyInstance } from 'fastify';
import { getHistory, getNow, getRawTelemetry, exportTelemetry } from '../controllers/telemetryController';

export default async function telemetryRoutes(fastify: FastifyInstance) {
  fastify.get('/history/:deviceId', { preValidation: [fastify.authenticate] }, getHistory);
  fastify.get('/now/:deviceId', { preValidation: [fastify.authenticate] }, getNow);
  fastify.get('/raw/:deviceId', { preValidation: [fastify.authenticate] }, getRawTelemetry);
  fastify.get('/export/:deviceId', { preValidation: [fastify.authenticate] }, exportTelemetry);
}
