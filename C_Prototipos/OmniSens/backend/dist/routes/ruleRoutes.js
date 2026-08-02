"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ruleRoutes;
const ruleController_1 = require("../controllers/ruleController");
async function ruleRoutes(fastify) {
    fastify.post('/', { preValidation: [fastify.authenticate] }, ruleController_1.createRule);
    fastify.get('/device/:deviceId', { preValidation: [fastify.authenticate] }, ruleController_1.getRules);
    fastify.delete('/:ruleId', { preValidation: [fastify.authenticate] }, ruleController_1.deleteRule);
}
