"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = telemetryRoutes;
const telemetryController_1 = require("../controllers/telemetryController");
async function telemetryRoutes(fastify) {
    // Rutas protegidas por JWT Multi-Tenant
    fastify.get('/history/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.getHistory);
    fastify.get('/now/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.getNow);
}
