@echo off
rem ==============================================================================
rem Script de Ejecución del Simulador local conectado a AWS (CMD Windows Batch)
rem ==============================================================================
rem Uso: run_simulator_aws.bat <IP_PUBLICA_AWS>
rem ==============================================================================

if "%~1"=="" (
  echo ❌ Error: Debes proporcionar la IP publica de AWS como primer parametro.
  echo Ejemplo de uso: run_simulator_aws.bat 54.123.45.67
  exit /b 1
)

set MQTT_BROKER_URL=mqtt://%~1:1883

echo 🔌 Configurando MQTT_BROKER_URL=%MQTT_BROKER_URL%
echo 📡 Iniciando el simulador interactivo de hardware...

rem Cambiar al directorio del backend y ejecutar
cd backend
node simulator.js
cd ..
