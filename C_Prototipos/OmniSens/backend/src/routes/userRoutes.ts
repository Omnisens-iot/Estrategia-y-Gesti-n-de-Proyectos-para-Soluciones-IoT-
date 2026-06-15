import { FastifyInstance } from 'fastify';
import { login, register } from '../controllers/userController';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/login', login);
  fastify.post('/register', register);
  
  // Perfil protegido
  fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    reply.send({ user: request.user });
  });
}
