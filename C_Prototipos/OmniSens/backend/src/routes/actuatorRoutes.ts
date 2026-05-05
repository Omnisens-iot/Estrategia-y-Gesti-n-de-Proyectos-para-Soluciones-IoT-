import { FastifyInstance } from 'fastify';
import { sendActuatorCommand, sendConfigCommand } from '../controllers/actuatorController';

export default async function actuatorRoutes(fastify: FastifyInstance) {
  // Las rutas usan el middleware de JWT que registramos globalmente (o localmente)
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.post('/:deviceId/actuators', sendActuatorCommand);
  fastify.post('/:deviceId/config', sendConfigCommand);
}
