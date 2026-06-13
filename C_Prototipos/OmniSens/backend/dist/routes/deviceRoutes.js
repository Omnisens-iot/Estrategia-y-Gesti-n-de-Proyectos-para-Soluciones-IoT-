"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deviceRoutes;
const deviceController_1 = require("../controllers/deviceController");
async function deviceRoutes(fastify) {
    // Ruta protegida por JWT Multi-Tenant
    fastify.get('/', { preValidation: [fastify.authenticate] }, deviceController_1.getDevices);
}
