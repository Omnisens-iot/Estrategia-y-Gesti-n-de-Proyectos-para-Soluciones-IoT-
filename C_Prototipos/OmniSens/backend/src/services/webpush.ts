import webpush from 'web-push';
import { db } from '../config/db';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BAEvyGWz5BfqXLfo6X1dqJrRKuJPmzpn0wUrtXsIeE1LJV1qa7e5c_-TcsUG8dqXs4V14ApfdBKgVwslp1xmuPI';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'k11AW0T8xGzVF9lT3X0hVv4PAxD7NW-oeR7eaqzj-AY';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@omnisens.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

export async function sendWebPushToClient(clientId: number, payload: any) {
  try {
    const subscriptions = await db.selectFrom('push_subscriptions')
      .selectAll()
      .where('client_id', '=', clientId)
      .execute();

    if (subscriptions.length === 0) return;

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
        await webpush.sendNotification(pushSubscription, payloadString);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // The subscription is no longer valid, delete it from DB
          await db.deleteFrom('push_subscriptions').where('id', '=', sub.id).execute();
          console.log(`🗑️ Suscripción Web Push eliminada por invalidez (ID: ${sub.id})`);
        } else {
          console.error(`❌ Error enviando Web Push a sub ID ${sub.id}:`, error);
        }
      }
    }
  } catch (err) {
    console.error('Error en sendWebPushToClient:', err);
  }
}
