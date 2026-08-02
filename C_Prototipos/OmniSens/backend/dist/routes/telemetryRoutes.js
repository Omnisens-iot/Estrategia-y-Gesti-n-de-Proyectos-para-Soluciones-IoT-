"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = telemetryRoutes;
const telemetryController_1 = require("../controllers/telemetryController");
async function telemetryRoutes(fastify) {
    fastify.get('/history/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.getHistory);
    fastify.get('/now/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.getNow);
    fastify.get('/raw/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.getRawTelemetry);
    fastify.get('/export/:deviceId', { preValidation: [fastify.authenticate] }, telemetryController_1.exportTelemetry);
}
