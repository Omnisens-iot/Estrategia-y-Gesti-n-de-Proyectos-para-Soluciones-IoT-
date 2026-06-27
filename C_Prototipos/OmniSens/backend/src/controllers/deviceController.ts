import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';
import crypto from 'crypto';

interface RegisterDeviceBody {
  device_id: string;
  mac_address: string;
  device_name?: string;
}

export const getDevices = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;

  try {
    const devices = await db.selectFrom('devices')
      .selectAll()
      .where('client_id', '=', clientId)
      // OBLIGATORIO: Omitir los dispositivos que tienen un Soft Delete
      .where('deleted_at', 'is', null)
      .execute();

    const devicesWithStatus = devices.map(device => {
      let isOnline = false;
      if (device.last_connection) {
        // Considerar offline si no hay datos en los últimos 5 minutos
        const diffMinutes = (new Date().getTime() - new Date(device.last_connection).getTime()) / 60000;
        isOnline = diffMinutes <= 5;
      }
      return {
        ...device,
        status: isOnline ? 'active' : 'inactive'
      };
    });

    reply.send(devicesWithStatus);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error interno obteniendo dispositivos' });
  }
};

export const registerDevice = async (request: FastifyRequest, reply: FastifyReply) => {
  const clientId = request.user.client_id;
  const { device_id, mac_address, device_name } = request.body as RegisterDeviceBody;

  if (!device_id || !mac_address) {
    return reply.status(400).send({ error: 'device_id y mac_address son requeridos' });
  }

  try {
    // Generate a secure random HMAC secret for this specific device
    const hmac_secret = crypto.randomBytes(32).toString('hex');

    const result = await db.insertInto('devices')
      .values({
        device_id,
        mac_address: mac_address.toUpperCase().replace(/:/g, ''),
        device_name: device_name || 'Nuevo Nodo',
        hmac_secret,
        client_id: clientId,
        status: 'inactive'
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return reply.status(500).send({ error: 'No se pudo registrar el dispositivo' });
    }

    reply.status(201).send({
      message: 'Dispositivo registrado exitosamente. Listo para Zero-Touch Provisioning.',
      device: result
    });
  } catch (error: any) {
    request.log.error(error);
    if (error.code === '23505') { // Unique violation in Postgres
      return reply.status(400).send({ error: 'El device_id o mac_address ya se encuentra registrado.' });
    }
    reply.status(500).send({ error: 'Error interno registrando dispositivo' });
  }
};
