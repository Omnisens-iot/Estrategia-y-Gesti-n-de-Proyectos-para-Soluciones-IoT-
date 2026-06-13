const mqtt = require('mqtt');
const readline = require('readline');

// Configuración del bróker MQTT (lee variables de entorno o usa localhost por defecto)
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const USERNAME = process.env.MQTT_USERNAME || 'backend_service';
const PASSWORD = process.env.MQTT_PASSWORD || 'backend_pass';

console.clear();
console.log('=====================================================');
console.log('      OmniSens - Simulador Interactivo de Hardware    ');
console.log('=====================================================');
console.log(`🔌 Conectando al bróker MQTT en: ${BROKER_URL}...`);

const client = mqtt.connect(BROKER_URL, {
  username: USERNAME,
  password: PASSWORD
});

// Estado interno de los nodos sensores simulados
const nodes = {
  AQC_001: {
    name: 'Nodo Central Oficina',
    temp: 23.5,
    hum: 45.0,
    pres: 1013.2,
    co2: 450,
    pm10: 12.0,
    lux: 300,
    l: 2100, // lectura analógica LDR
    battery: 3.85,
    r1: 0,
    r2: 0,
    pwm: 0
  },
  AQC_002: {
    name: 'Nodo Exterior Patio',
    temp: 16.2,
    hum: 68.4,
    pres: 1009.5,
    co2: -1.0, // MQ135 Ausente
    pm10: 25.1,
    lux: 15,
    l: -1,     // LDR Ausente (Sólo digital)
    battery: 3.78,
    r1: 0,
    r2: 0,
    pwm: 0
  }
};

// Flags para simular desviaciones y alarmas interactivas
let simulateLightDeviation = false;
let simulateLowBattery = false;

client.on('connect', () => {
  console.log('✅ Conectado al bróker MQTT.');
  console.log('📡 Suscribiendo a tópicos de comandos...');

  // Suscribirse a comandos de actuadores y configuración de ambos dispositivos
  client.subscribe('aqi/commands/+/actuators');
  client.subscribe('aqi/commands/+/config');

  console.log('🎮 Simulador listo y corriendo.');
  showHelp();
  
  // Iniciar ciclo de envío de telemetría cada 5 segundos
  setInterval(publishTelemetry, 5000);
});

client.on('message', (topic, message) => {
  const parts = topic.split('/');
  const deviceId = parts[2];
  const type = parts[3];

  if (!nodes[deviceId]) {
    console.log(`⚠️ Comando recibido para nodo desconocido: ${deviceId}`);
    return;
  }

  try {
    const payload = JSON.parse(message.toString());
    
    if (type === 'actuators') {
      console.log(`\n📥 [COMANDO] Actuadores recibidos para ${deviceId}:`, payload);
      
      // Actualizar el estado del hardware simulado
      if (payload.r1 !== undefined) nodes[deviceId].r1 = payload.r1 ? 1 : 0;
      if (payload.r2 !== undefined) nodes[deviceId].r2 = payload.r2 ? 1 : 0;
      if (payload.pwm !== undefined) nodes[deviceId].pwm = payload.pwm;

      console.log(`🔧 [ESTADO] ${deviceId} actualizado -> R1: ${nodes[deviceId].r1} | R2: ${nodes[deviceId].r2} | PWM: ${nodes[deviceId].pwm}`);
    } else if (type === 'config') {
      console.log(`\n📥 [CONFIG] Ajuste de automatización recibido para ${deviceId}:`, payload);
    }
  } catch (err) {
    console.error('❌ Error al decodificar comando:', err.message);
  }
});

// Función para publicar telemetrías realistas
function publishTelemetry() {
  Object.keys(nodes).forEach((deviceId) => {
    const node = nodes[deviceId];

    // Variaciones naturales del entorno
    node.temp += (Math.random() - 0.5) * 0.2;
    node.hum += (Math.random() - 0.5) * 0.5;
    node.pres += (Math.random() - 0.5) * 0.1;
    
    if (node.co2 !== -1.0) {
      node.co2 += Math.round((Math.random() - 0.5) * 4);
    }
    
    node.pm10 += (Math.random() - 0.5) * 0.3;
    
    // Simular nivel de batería (descarga muy lenta)
    node.battery -= 0.0001;

    // Lógica de Luz e interacciones
    if (deviceId === 'AQC_001') {
      if (simulateLightDeviation) {
        // Mismatch: LDR indica completa oscuridad (> 3900) pero el digital lux reporta alta luminosidad (600 lx)
        node.lux = 600.0;
        node.l = 3950;
      } else {
        // Relación normal inversa: A mayor lux (luz), menor lectura LDR analógica
        node.lux = 300.0 + (Math.random() - 0.5) * 20;
        node.l = Math.round(4095 - (node.lux * 8.5)); 
        node.l = Math.max(100, Math.min(4000, node.l));
      }
    } else if (deviceId === 'AQC_002') {
      if (simulateLowBattery) {
        node.battery = 3.25; // Tensión muy baja (cerca de 0%)
      }
      node.lux = 15.0 + (Math.random() - 0.5) * 2;
    }

    const payload = {
      temp: parseFloat(node.temp.toFixed(2)),
      hum: parseFloat(node.hum.toFixed(2)),
      pres: parseFloat(node.pres.toFixed(2)),
      co2: node.co2,
      pm10: parseFloat(node.pm10.toFixed(2)),
      lux: parseFloat(node.lux.toFixed(2)),
      l: node.l,
      battery: parseFloat(node.battery.toFixed(2)),
      r1: node.r1,
      r2: node.r2,
      pwm: node.pwm
    };

    const topic = `aqi/telemetry/${deviceId}/data`;
    client.publish(topic, JSON.stringify(payload));
  });

  // Imprimir resumen en la terminal
  printDashboardSummary();
}

function printDashboardSummary() {
  process.stdout.write('\r');
  const d1 = nodes.AQC_001;
  const d2 = nodes.AQC_002;
  
  console.log(`\n📊 [TELEM] Enviado: `);
  console.log(`   - ${d1.name} (AQC_001): Temp: ${d1.temp.toFixed(1)}°C | Lux: ${d1.lux.toFixed(0)} lx | LDR: ${d1.l} | Bat: ${d1.battery.toFixed(2)}V | Actuadores: R1=${d1.r1} R2=${d1.r2} PWM=${d1.pwm} ${simulateLightDeviation ? '[⚠️ DESVÍO DE LUZ ACTIVO]' : ''}`);
  console.log(`   - ${d2.name} (AQC_002): Temp: ${d2.temp.toFixed(1)}°C | Lux: ${d2.lux.toFixed(0)} lx | Bat: ${d2.battery.toFixed(2)}V | Actuadores: R1=${d2.r1} R2=${d2.r2} PWM=${d2.pwm} ${simulateLowBattery ? '[⚠️ BATERÍA CRÍTICA ACTIVA]' : ''}`);
}

function showHelp() {
  console.log('\n--- Comandos interactivos ---');
  console.log(' [d] : Activar/Desactivar desvío de luz en AQC_001 (para ver alerta en Dashboard)');
  console.log(' [b] : Activar/Desactivar batería crítica en AQC_002 (para ver alerta de batería)');
  console.log(' [h] : Mostrar esta ayuda');
  console.log(' [q] : Salir del simulador');
  console.log('-----------------------------\n');
}

// Configurar lectura de teclado interactiva
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c' || key.name === 'q') {
    console.log('\n🔌 Desconectando y saliendo...');
    client.end();
    process.exit();
  }

  switch (key.name) {
    case 'd':
      simulateLightDeviation = !simulateLightDeviation;
      console.log(`\n🔧 [SIM] Simulación de desvío de luz en AQC_001: ${simulateLightDeviation ? 'ACTIVADA' : 'DESACTIVADA'}`);
      break;
    case 'b':
      simulateLowBattery = !simulateLowBattery;
      console.log(`\n🔧 [SIM] Simulación de batería crítica en AQC_002: ${simulateLowBattery ? 'ACTIVADA' : 'DESACTIVADA'}`);
      break;
    case 'h':
      showHelp();
      break;
  }
});
