import { FastifyInstance } from 'fastify';
import { getDevices, registerDevice } from '../controllers/deviceController';
import { getDeviceRules, saveDeviceRules } from '../controllers/rulesController';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Rutas protegidas por JWT Multi-Tenant
  fastify.get('/', { preValidation: [fastify.authenticate] }, getDevices);
  fastify.post('/', { preValidation: [fastify.authenticate] }, registerDevice);
  
  // Rutas para reglas
  fastify.get('/:deviceId/rules', { preValidation: [fastify.authenticate] }, getDeviceRules);
  fastify.post('/:deviceId/rules', { preValidation: [fastify.authenticate] }, saveDeviceRules);
}
