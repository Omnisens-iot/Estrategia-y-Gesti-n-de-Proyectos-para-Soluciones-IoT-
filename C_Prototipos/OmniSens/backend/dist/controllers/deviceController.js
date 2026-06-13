"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevices = void 0;
const db_1 = require("../config/db");
const getDevices = async (request, reply) => {
    const clientId = request.user.client_id;
    try {
        const devices = await db_1.db.selectFrom('devices')
            .selectAll()
            .where('client_id', '=', clientId)
            // OBLIGATORIO: Omitir los dispositivos que tienen un Soft Delete
            .where('deleted_at', 'is', null)
            .execute();
        reply.send(devices);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno obteniendo dispositivos' });
    }
};
exports.getDevices = getDevices;
