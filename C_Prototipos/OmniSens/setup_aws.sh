#!/bin/bash
# ==============================================================================
# Script de Inicialización Rápida para AWS EC2 (Ubuntu 22.04/24.04)
# ==============================================================================
# Este script realiza la instalación automatizada de Docker y Docker Compose V2.
#
# Instrucciones de ejecución:
# 1. Conéctate a tu instancia EC2 por SSH:
#    ssh -i tu-clave.pem ubuntu@<IP-PUBLICA-AWS>
# 2. Copia este archivo al servidor, dale permisos de ejecución y ejecútalo:
#    chmod +x setup_aws.sh
#    ./setup_aws.sh
# ==============================================================================

# Detener el script ante cualquier error
set -e

echo "🔄 Actualizando repositorios del sistema..."
sudo apt-get update -y

echo "📦 Instalando dependencias básicas..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "🔑 Agregando la clave GPG oficial de Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "📂 Configurando el repositorio oficial de Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "🔄 Actualizando repositorios con las fuentes de Docker..."
sudo apt-get update -y

echo "🐳 Instalando Docker Engine y Docker Compose..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "👤 Configurando permisos del usuario actual (ubuntu)..."
sudo usermod -aG docker $USER

echo "🚀 Habilitando servicios de Docker al arrancar..."
sudo systemctl enable docker
sudo systemctl start docker

echo "=============================================================================="
echo "✅ Instalación completada con éxito."
echo "=============================================================================="
echo "⚠️ IMPORTANTE: Cierra la sesión SSH actual y vuelve a entrar para aplicar"
echo "   los permisos de grupo sin necesidad de usar 'sudo' con docker."
echo "=============================================================================="
echo ""
echo "📝 PASOS PARA CLONAR Y EJECUTAR EL PROYECTO:"
echo "1. Clona el repositorio git de tu proyecto:"
echo "   git clone <URL_DEL_REPOSITORIO>"
echo "   cd <DIRECTORIO_DEL_REPOSITORIO>"
echo ""
echo "2. Levanta los contenedores en segundo plano (background):"
echo "   docker compose up -d --build"
echo ""
echo "3. Verifica que los servicios estén corriendo:"
echo "   docker compose ps"
echo "=============================================================================="
