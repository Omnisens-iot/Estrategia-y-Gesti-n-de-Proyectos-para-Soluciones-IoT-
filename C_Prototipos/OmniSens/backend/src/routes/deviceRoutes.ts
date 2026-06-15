import { FastifyInstance } from 'fastify';
import { getDevices, registerDevice } from '../controllers/deviceController';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Rutas protegidas por JWT Multi-Tenant
  fastify.get('/', { preValidation: [fastify.authenticate] }, getDevices);
  fastify.post('/', { preValidation: [fastify.authenticate] }, registerDevice);
}
