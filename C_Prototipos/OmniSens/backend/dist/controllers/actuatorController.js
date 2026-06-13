"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConfigCommand = exports.sendActuatorCommand = void 0;
const db_1 = require("../config/db");
const mqtt_1 = require("../services/mqtt");
const sendActuatorCommand = async (req, reply) => {
    try {
        const { deviceId } = req.params;
        const payload = req.body;
        const userClientId = req.user.client_id;
        const device = await db_1.db.selectFrom('devices')
            .select('device_id')
            .where('device_id', '=', deviceId)
            .where('client_id', '=', userClientId)
            .where('deleted_at', 'is', null)
            .executeTakeFirst();
        if (!device) {
            return reply.status(403).send({ error: 'Device not found or unauthorized' });
        }
        // Publicar a través de MQTT
        (0, mqtt_1.publishCommand)(deviceId, 'actuators', payload);
        return reply.send({ success: true, message: 'Actuator command sent' });
    }
    catch (err) {
        req.log.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.sendActuatorCommand = sendActuatorCommand;
const sendConfigCommand = async (req, reply) => {
    try {
        const { deviceId } = req.params;
        const payload = req.body;
        const userClientId = req.user.client_id;
        const device = await db_1.db.selectFrom('devices')
            .select('device_id')
            .where('device_id', '=', deviceId)
            .where('client_id', '=', userClientId)
            .where('deleted_at', 'is', null)
            .executeTakeFirst();
        if (!device) {
            return reply.status(403).send({ error: 'Device not found or unauthorized' });
        }
        // Publicar a través de MQTT
        (0, mqtt_1.publishCommand)(deviceId, 'config', payload);
        return reply.send({ success: true, message: 'Config command sent' });
    }
    catch (err) {
        req.log.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.sendConfigCommand = sendConfigCommand;
