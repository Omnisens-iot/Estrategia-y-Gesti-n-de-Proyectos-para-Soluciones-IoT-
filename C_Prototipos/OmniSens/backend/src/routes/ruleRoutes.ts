import { FastifyInstance } from 'fastify';
import { createRule, getRules, deleteRule } from '../controllers/ruleController';

export default async function ruleRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preValidation: [fastify.authenticate] }, createRule);
  fastify.get<{ Params: { deviceId: string } }>('/device/:deviceId', { preValidation: [fastify.authenticate] }, getRules);
  fastify.delete<{ Params: { ruleId: string } }>('/:ruleId', { preValidation: [fastify.authenticate] }, deleteRule);
}
