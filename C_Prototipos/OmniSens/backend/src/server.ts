import Fastify from 'fastify';
import dotenv from 'dotenv';
import jwtPlugin from './plugins/jwt';
import { setupMqttSubscriber } from './services/mqtt';

dotenv.config();

const server = Fastify({
  logger: true
});

// Registrar el plugin JWT
server.register(jwtPlugin);

// Registrar rutas
import deviceRoutes from './routes/deviceRoutes';
import telemetryRoutes from './routes/telemetryRoutes';
import actuatorRoutes from './routes/actuatorRoutes';

server.register(deviceRoutes, { prefix: '/api/devices' });
server.register(telemetryRoutes, { prefix: '/api/telemetry' });
server.register(actuatorRoutes, { prefix: '/api/devices' });

// Endpoint público de salud
server.get('/health', async () => {
  return { status: 'ok', service: 'OmniSens Backend API' };
});

const start = async () => {
  try {
    // Iniciar el servicio MQTT que correrá en segundo plano ingiriendo datos
    setupMqttSubscriber();
    
    // Levantar la API REST
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor Fastify corriendo en el puerto ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
