#!/bin/bash
# ==============================================================================
# Script de Instalación y Configuración del Splunk Universal Forwarder para AWS
# ==============================================================================
# Este script descarga, instala y conecta el Universal Forwarder con Splunk Cloud
# utilizando el paquete de credenciales descargado manualmente (splunkclouduf.spl).
# ==============================================================================

# Detener ejecución si ocurre algún error
set -e

# Configuración de variables (puedes personalizarlas)
SPLUNK_ADMIN_USER="omniadmin"
SPLUNK_ADMIN_PASS="omni_sens_2026"  # Reemplázala por tu contraseña de administración local
CREDENTIALS_FILE="/home/ubuntu/splunkclouduf.spl"
DEB_URL="https://download.splunk.com/products/universalforwarder/releases/9.4.0/linux/splunkforwarder-9.4.0-6b4ebe426ca6-linux-amd64.deb"

echo "🔍 Paso 1: Validando archivo de credenciales de Splunk Cloud..."
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $CREDENTIALS_FILE en la instancia."
    echo "Por favor, sube primero el archivo splunkclouduf.spl desde tu PC local usando SCP."
    exit 1
fi
echo "✅ Archivo de credenciales encontrado en $CREDENTIALS_FILE"

echo "📥 Paso 2: Descargando Splunk Universal Forwarder..."
wget -q -O /tmp/splunkforwarder.deb "$DEB_URL"
echo "✅ Descarga completada."

echo "⚙️ Paso 3: Instalando paquete .deb..."
sudo dpkg -i /tmp/splunkforwarder.deb
echo "✅ Instalación completada."

echo "🔑 Paso 4: Pre-configurando credenciales de administración local (user-seed)..."
# Crear archivo de semilla para evitar que el primer arranque solicite contraseña interactivamente
sudo mkdir -p /opt/splunkforwarder/etc/system/local
sudo tee /opt/splunkforwarder/etc/system/local/user-seed.conf > /dev/null <<EOF
[user_info]
USERNAME = $SPLUNK_ADMIN_USER
PASSWORD = $SPLUNK_ADMIN_PASS
EOF
echo "✅ Semilla de usuario creada."

echo "🚀 Paso 5: Iniciando Splunk Forwarder por primera vez..."
sudo /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes --no-prompt
echo "✅ Servicio iniciado."

echo "🔄 Paso 6: Configurando arranque automático como servicio..."
sudo /opt/splunkforwarder/bin/splunk enable boot-start -user splunkfwd
echo "✅ Arranque automático habilitado."

echo "📦 Paso 7: Instalando App de Credenciales de Splunk Cloud..."
sudo /opt/splunkforwarder/bin/splunk install app "$CREDENTIALS_FILE" -auth "$SPLUNK_ADMIN_USER:$SPLUNK_ADMIN_PASS"
echo "✅ Credenciales de Splunk Cloud instaladas con éxito."

echo "📂 Paso 8: Configurando monitoreo de contenedores Docker (inputs.conf)..."
# Crear o anexar el bloque de monitoreo en inputs.conf
sudo tee -a /opt/splunkforwarder/etc/system/local/inputs.conf > /dev/null <<EOF

[monitor:///var/lib/docker/containers/*/*-json.log]
disabled = false
sourcetype = _json
index = omnisens_logs
EOF
echo "✅ Archivo inputs.conf configurado."

echo "🔒 Paso 9: Configurando permisos para el acceso a logs de Docker..."
# Añadir splunk al grupo docker
sudo usermod -aG docker splunkfwd
# Configurar ACLs en la carpeta de contenedores
sudo apt-get update -y && sudo apt-get install acl -y
sudo setfacl -R -m u:splunkfwd:rx /var/lib/docker/containers/
echo "✅ Permisos de acceso a logs de Docker otorgados."

echo "🔧 Paso 10: Ajustando propietario de directorios y reiniciando servicio..."
sudo chown -R splunkfwd:splunkfwd /opt/splunkforwarder
sudo service splunk restart
echo "✅ Splunk Universal Forwarder reiniciado."

echo "=========================================================================="
echo "🎉 ¡Configuración Exitosa! El agente ya está enviando logs a Splunk Cloud."
echo "Puedes buscar tus eventos usando la consulta: index=\"omnisens_logs\""
echo "=========================================================================="
