"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceRoutes;
const deviceController_1 = require("../controllers/deviceController");
const rulesController_1 = require("../controllers/rulesController");
async function deviceRoutes(fastify) {
    // Rutas protegidas por JWT Multi-Tenant
    fastify.get('/', { preValidation: [fastify.authenticate] }, deviceController_1.getDevices);
    fastify.post('/', { preValidation: [fastify.authenticate] }, deviceController_1.registerDevice);
    // Rutas para reglas
    fastify.get('/:deviceId/rules', { preValidation: [fastify.authenticate] }, rulesController_1.getDeviceRules);
    fastify.post('/:deviceId/rules', { preValidation: [fastify.authenticate] }, rulesController_1.saveDeviceRules);
}
