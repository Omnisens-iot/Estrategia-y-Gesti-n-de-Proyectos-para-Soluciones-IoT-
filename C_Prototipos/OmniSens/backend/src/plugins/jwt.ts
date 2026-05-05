import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { 
      sub: string;
      email: string;
      role: string;
      client_id: number; // Dato vital para el aislamiento Multi-Tenant
    }; 
    user: {
      sub: string;
      email: string;
      role: string;
      client_id: number;
    };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  // Se registra el plugin oficial de JWT
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret_hs256_key_for_development'
  });

  // Decorador para ser usado como preValidation (middleware) en las rutas protegidas
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verifica la firma y expiración del token. Extrae el payload en request.user
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'No autorizado o token expirado' });
    }
  });
});
