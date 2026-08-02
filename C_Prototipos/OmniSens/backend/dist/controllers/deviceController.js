"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDevice = exports.getDevices = void 0;
const db_1 = require("../config/db");
const crypto_1 = __importDefault(require("crypto"));
const getDevices = async (request, reply) => {
    const clientId = request.user.client_id;
    try {
        const devices = await db_1.db.selectFrom('devices')
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
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno obteniendo dispositivos' });
    }
};
exports.getDevices = getDevices;
const registerDevice = async (request, reply) => {
    const clientId = request.user.client_id;
    const { device_id, mac_address, device_name } = request.body;
    if (!device_id || !mac_address) {
        return reply.status(400).send({ error: 'device_id y mac_address son requeridos' });
    }
    try {
        // Generate a secure random HMAC secret for this specific device
        const hmac_secret = crypto_1.default.randomBytes(32).toString('hex');
        const result = await db_1.db.insertInto('devices')
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
    }
    catch (error) {
        request.log.error(error);
        if (error.code === '23505') { // Unique violation in Postgres
            return reply.status(400).send({ error: 'El device_id o mac_address ya se encuentra registrado.' });
        }
        reply.status(500).send({ error: 'Error interno registrando dispositivo' });
    }
};
exports.registerDevice = registerDevice;
