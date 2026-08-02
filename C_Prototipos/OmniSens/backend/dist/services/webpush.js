"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWebPushToClient = sendWebPushToClient;
const web_push_1 = __importDefault(require("web-push"));
const db_1 = require("../config/db");
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BAEvyGWz5BfqXLfo6X1dqJrRKuJPmzpn0wUrtXsIeE1LJV1qa7e5c_-TcsUG8dqXs4V14ApfdBKgVwslp1xmuPI';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'k11AW0T8xGzVF9lT3X0hVv4PAxD7NW-oeR7eaqzj-AY';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@omnisens.com';
web_push_1.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
async function sendWebPushToClient(clientId, payload) {
    try {
        const subscriptions = await db_1.db.selectFrom('push_subscriptions')
            .selectAll()
            .where('client_id', '=', clientId)
            .execute();
        if (subscriptions.length === 0)
            return;
        const payloadString = JSON.stringify(payload);
        for (const sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth,
                    p256dh: sub.p256dh
                }
            };
            try {
                await web_push_1.default.sendNotification(pushSubscription, payloadString);
            }
            catch (error) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // The subscription is no longer valid, delete it from DB
                    await db_1.db.deleteFrom('push_subscriptions').where('id', '=', sub.id).execute();
                    console.log(`🗑️ Suscripción Web Push eliminada por invalidez (ID: ${sub.id})`);
                }
                else {
                    console.error(`❌ Error enviando Web Push a sub ID ${sub.id}:`, error);
                }
            }
        }
    }
    catch (err) {
        console.error('Error en sendWebPushToClient:', err);
    }
}
