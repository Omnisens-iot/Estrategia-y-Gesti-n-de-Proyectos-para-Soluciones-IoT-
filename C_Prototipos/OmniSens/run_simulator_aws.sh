#!/bin/bash
# ==============================================================================
# Script de Ejecución del Simulador local conectado a AWS (Linux / macOS)
# ==============================================================================
# Uso: ./run_simulator_aws.sh <IP_PUBLICA_AWS>
# ==============================================================================

if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar la IP pública de AWS como primer parámetro."
  echo "Ejemplo de uso: ./run_simulator_aws.sh 54.123.45.67"
  exit 1
fi

export MQTT_BROKER_URL="mqtt://$1:1883"

echo "🔌 Configurando MQTT_BROKER_URL=$MQTT_BROKER_URL"
echo "📡 Iniciando el simulador interactivo de hardware..."

# Cambiar al directorio del backend y ejecutar
cd backend
node simulator.js
