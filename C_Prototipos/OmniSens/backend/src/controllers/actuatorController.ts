import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';
import { publishCommand } from '../services/mqtt';

export const sendActuatorCommand = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { deviceId } = req.params as { deviceId: string };
    const payload = req.body as any;
    
    const userClientId = (req.user as any).client_id;
    
    const device = await db.selectFrom('devices')
      .select(['device_id', 'mac_address'])
      .where('device_id', '=', deviceId)
      .where('client_id', '=', userClientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
      
    if (!device) {
      return reply.status(403).send({ error: 'Device not found or unauthorized' });
    }
    
    // Publicar a través de MQTT usando la MAC address normalizada (sin dos puntos)
    const normalizedMac = device.mac_address.toUpperCase().replace(/:/g, '');
    publishCommand(normalizedMac, 'actuators', payload);
    
    return reply.send({ success: true, message: 'Actuator command sent' });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const sendConfigCommand = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { deviceId } = req.params as { deviceId: string };
    const payload = req.body as any;
    
    const userClientId = (req.user as any).client_id;
    
    const device = await db.selectFrom('devices')
      .select(['device_id', 'mac_address'])
      .where('device_id', '=', deviceId)
      .where('client_id', '=', userClientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
      
    if (!device) {
      return reply.status(403).send({ error: 'Device not found or unauthorized' });
    }
    
    // Publicar a través de MQTT usando la MAC address normalizada (sin dos puntos)
    const normalizedMac = device.mac_address.toUpperCase().replace(/:/g, '');
    publishCommand(normalizedMac, 'config', payload);
    
    return reply.send({ success: true, message: 'Config command sent' });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
