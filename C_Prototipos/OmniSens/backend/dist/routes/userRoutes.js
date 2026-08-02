"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const userController_1 = require("../controllers/userController");
async function userRoutes(fastify) {
    fastify.post('/login', userController_1.login);
    fastify.post('/register', userController_1.register);
    // Perfil protegido
    fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        reply.send({ user: request.user });
    });
}
