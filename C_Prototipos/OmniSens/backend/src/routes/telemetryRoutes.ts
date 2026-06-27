import { FastifyInstance } from 'fastify';
import { getHistory, getNow, getRawTelemetry } from '../controllers/telemetryController';

export default async function telemetryRoutes(fastify: FastifyInstance) {
  // Rutas protegidas por JWT Multi-Tenant
  fastify.get('/history/:deviceId', { preValidation: [fastify.authenticate] }, getHistory);
  fastify.get('/now/:deviceId', { preValidation: [fastify.authenticate] }, getNow);
  fastify.get('/raw/:deviceId', { preValidation: [fastify.authenticate] }, getRawTelemetry);
}
