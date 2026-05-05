import { FastifyInstance } from 'fastify';
import { getDevices } from '../controllers/deviceController';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Ruta protegida por JWT Multi-Tenant
  fastify.get('/', { preValidation: [fastify.authenticate] }, getDevices);
}
