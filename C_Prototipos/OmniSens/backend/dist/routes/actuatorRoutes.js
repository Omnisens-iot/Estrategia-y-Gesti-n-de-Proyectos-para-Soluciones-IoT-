"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = actuatorRoutes;
const actuatorController_1 = require("../controllers/actuatorController");
async function actuatorRoutes(fastify) {
    // Las rutas usan el middleware de JWT que registramos globalmente (o localmente)
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    fastify.post('/:deviceId/actuators', actuatorController_1.sendActuatorCommand);
    fastify.post('/:deviceId/config', actuatorController_1.sendConfigCommand);
}
