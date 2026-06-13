<#
.SYNOPSIS
  Script de Ejecución del Simulador local conectado a AWS (PowerShell Windows)
.DESCRIPTION
  Uso: .\run_simulator_aws.ps1 -AwsIp <IP_PUBLICA_AWS>
  O simplemente: .\run_simulator_aws.ps1 54.123.45.67
#>

param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$AwsIp
)

$env:MQTT_BROKER_URL = "mqtt://$AwsIp:1883"

Write-Host "🔌 Configurando `$env:MQTT_BROKER_URL = $env:MQTT_BROKER_URL" -ForegroundColor Cyan
Write-Host "📡 Iniciando el simulador interactivo de hardware..." -ForegroundColor Green

# Cambiar al directorio del backend y ejecutar
cd backend
node simulator.js
cd ..
