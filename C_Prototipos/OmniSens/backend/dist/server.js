"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const jwt_1 = __importDefault(require("./plugins/jwt"));
const mqtt_1 = require("./services/mqtt");
dotenv_1.default.config();
const server = (0, fastify_1.default)({
    logger: true
});
// Registrar el plugin JWT
server.register(jwt_1.default);
// Registrar rutas
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
const telemetryRoutes_1 = __importDefault(require("./routes/telemetryRoutes"));
const actuatorRoutes_1 = __importDefault(require("./routes/actuatorRoutes"));
server.register(deviceRoutes_1.default, { prefix: '/api/devices' });
server.register(telemetryRoutes_1.default, { prefix: '/api/telemetry' });
server.register(actuatorRoutes_1.default, { prefix: '/api/devices' });
// Endpoint público de salud
server.get('/health', async () => {
    return { status: 'ok', service: 'OmniSens Backend API' };
});
const start = async () => {
    try {
        // Iniciar el servicio MQTT que correrá en segundo plano ingiriendo datos
        (0, mqtt_1.setupMqttSubscriber)();
        // Levantar la API REST
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Servidor Fastify corriendo en el puerto ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
