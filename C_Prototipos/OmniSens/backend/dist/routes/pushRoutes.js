"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pushRoutes;
const db_1 = require("../config/db");
async function pushRoutes(fastify) {
    fastify.post('/subscribe', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            // Usar request.user si existe (middleware JWT) o parsearlo
            const user = request.user;
            if (!user) {
                return reply.status(401).send({ error: 'No autorizado' });
            }
            const client_id = user.client_id;
            const subscription = request.body;
            if (!subscription || !subscription.endpoint || !subscription.keys) {
                return reply.status(400).send({ error: 'Suscripción inválida' });
            }
            // Check if subscription already exists
            const existing = await db_1.db.selectFrom('push_subscriptions')
                .select('id')
                .where('endpoint', '=', subscription.endpoint)
                .executeTakeFirst();
            if (existing) {
                // Update user ownership just in case
                await db_1.db.updateTable('push_subscriptions')
                    .set({ client_id })
                    .where('id', '=', existing.id)
                    .execute();
            }
            else {
                await db_1.db.insertInto('push_subscriptions')
                    .values({
                    client_id,
                    endpoint: subscription.endpoint,
                    auth: subscription.keys.auth,
                    p256dh: subscription.keys.p256dh
                })
                    .execute();
            }
            return reply.send({ success: true, message: 'Suscripción guardada exitosamente' });
        }
        catch (error) {
            console.error('Error al guardar suscripción Push:', error);
            return reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });
}
