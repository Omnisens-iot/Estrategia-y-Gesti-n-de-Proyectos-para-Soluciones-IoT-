import { db } from '../src/config/db';
import crypto from 'crypto';

// ============================================================================
// Script de Registro por Lotes (Batch Registration)
// Uso: npx tsx scripts/registerNodes.ts
// ============================================================================

// 1. Configura aquí el ID del cliente dueño de los nodos (Ej: 1 para el Demo)
const TARGET_CLIENT_ID = 1;

// 2. Agrega aquí la lista de MACs de tus ESP32 físicos y sus nombres
const nodesToRegister = [
  { mac: 'C8:F0:9E:AA:BB:CC', name: 'Nodo AQC_003 (Taller)' },
  { mac: 'C8:F0:9E:DD:EE:FF', name: 'Nodo AQC_004 (Comedor)' },
  // Agrega más ESP32 aquí...
];

async function run() {
  console.log(`🚀 Iniciando registro por lotes para ${nodesToRegister.length} nodos...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < nodesToRegister.length; i++) {
    const node = nodesToRegister[i];
    const deviceId = `AQC_BATCH_${Date.now().toString().slice(-4)}_${i}`; // Genera un ID único temporal
    const hmacSecret = crypto.randomBytes(32).toString('hex'); // Genera la llave segura única

    try {
      await db.insertInto('devices')
        .values({
          device_id: deviceId,
          mac_address: node.mac.toLowerCase(),
          device_name: node.name,
          hmac_secret: hmacSecret,
          client_id: TARGET_CLIENT_ID,
          status: 'inactive'
        })
        .execute();

      console.log(`✅ Registrado: ${node.mac} -> ${node.name} (ID: ${deviceId})`);
      successCount++;
    } catch (err: any) {
      if (err.code === '23505') {
        console.log(`⚠️  Omitido: ${node.mac} (Ya estaba registrado en la base de datos)`);
      } else {
        console.error(`❌ Error registrando ${node.mac}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log('----------------------------------------------------');
  console.log(`🏁 Proceso finalizado. Éxitos: ${successCount} | Errores: ${errorCount}`);
  process.exit(0);
}

run();
