import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';
import { publishCommand } from '../services/mqtt';

export const getDeviceRules = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { deviceId } = req.params as { deviceId: string };
    const userClientId = (req.user as any).client_id;
    
    // Check if device belongs to client
    const device = await db.selectFrom('devices')
      .select(['device_id'])
      .where('device_id', '=', deviceId)
      .where('client_id', '=', userClientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
      
    if (!device) {
      return reply.status(403).send({ error: 'Device not found or unauthorized' });
    }
    
    // Get rules
    const rules = await db.selectFrom('device_rules')
      .selectAll()
      .where('device_id', '=', deviceId)
      .orderBy('priority', 'asc')
      .execute();
      
    return reply.send(rules);
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const saveDeviceRules = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { deviceId } = req.params as { deviceId: string };
    const { rules } = req.body as { rules: any[] };
    const userClientId = (req.user as any).client_id;
    
    // Check if device belongs to client
    const device = await db.selectFrom('devices')
      .select(['device_id', 'mac_address'])
      .where('device_id', '=', deviceId)
      .where('client_id', '=', userClientId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
      
    if (!device) {
      return reply.status(403).send({ error: 'Device not found or unauthorized' });
    }
    
    // Delete existing rules for this device
    await db.deleteFrom('device_rules')
      .where('device_id', '=', deviceId)
      .execute();
      
    // Insert new rules
    if (rules && rules.length > 0) {
      const rulesToInsert = rules.map((r, index) => ({
        device_id: deviceId,
        metric: r.metric,
        threshold: r.threshold,
        hysteresis: r.hysteresis,
        action: r.action,
        priority: r.priority !== undefined ? r.priority : index + 1
      }));
      
      await db.insertInto('device_rules')
        .values(rulesToInsert)
        .execute();
    }
    
    // Publicar a través de MQTT usando la MAC address normalizada (sin dos puntos)
    const normalizedMac = device.mac_address.toUpperCase().replace(/:/g, '');
    
    // El ESP32 espera el payload en el tópico de config con un array "rules"
    publishCommand(normalizedMac, 'config', { rules: rules });
    
    return reply.send({ success: true, message: 'Rules saved and sent to device' });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
