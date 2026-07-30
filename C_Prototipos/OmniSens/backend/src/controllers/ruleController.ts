import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';

export const createRule = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { deviceId, metric, threshold, condition, chatId } = req.body as any;

    if (!deviceId || !metric || threshold === undefined || !condition || !chatId) {
      return reply.status(400).send({ message: 'Missing required fields' });
    }

    const newRule = await db.insertInto('device_rules')
      .values({
        device_id: deviceId,
        metric: metric,
        threshold: threshold,
        condition: condition,
        chat_id: chatId,
        hysteresis: 0,
        action: 'telegram',
        priority: 1
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return reply.status(201).send(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getRules = async (req: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
  try {
    const { deviceId } = req.params;
    const rules = await db.selectFrom('device_rules')
      .selectAll()
      .where('device_id', '=', deviceId)
      .execute();

    return reply.send(rules);
  } catch (error) {
    console.error('Error getting rules:', error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const deleteRule = async (req: FastifyRequest<{ Params: { ruleId: string } }>, reply: FastifyReply) => {
  try {
    const { ruleId } = req.params;
    await db.deleteFrom('device_rules')
      .where('rule_id', '=', parseInt(ruleId))
      .execute();

    return reply.send({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
