import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';

export const getDevices = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;

  try {
    const devices = await db.selectFrom('devices')
      .selectAll()
      .where('client_id', '=', clientId)
      // OBLIGATORIO: Omitir los dispositivos que tienen un Soft Delete
      .where('deleted_at', 'is', null)
      .execute();

    reply.send(devices);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error interno obteniendo dispositivos' });
  }
};
