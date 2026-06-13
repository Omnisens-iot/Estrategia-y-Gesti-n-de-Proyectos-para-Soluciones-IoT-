"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    // Se registra el plugin oficial de JWT
    fastify.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || 'supersecret_hs256_key_for_development'
    });
    // Decorador para ser usado como preValidation (middleware) en las rutas protegidas
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader === 'Bearer mock_jwt_token_12345') {
                // Bypass para desarrollo y pruebas locales con el frontend mockup
                request.user = {
                    sub: 'mock-user-id-001',
                    email: 'admin@omnisens.com',
                    role: 'admin',
                    client_id: 1
                };
                return;
            }
            // Verifica la firma y expiración del token. Extrae el payload en request.user
            await request.jwtVerify();
        }
        catch (err) {
            reply.status(401).send({ error: 'No autorizado o token expirado' });
        }
    });
});
