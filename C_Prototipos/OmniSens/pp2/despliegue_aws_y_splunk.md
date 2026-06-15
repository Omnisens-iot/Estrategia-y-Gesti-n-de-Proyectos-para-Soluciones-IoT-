# Guía de Despliegue en AWS EC2 e Integración de Logs con Splunk

Este documento detalla la arquitectura de despliegue rápido de la plataforma **OmniSens** directamente en una instancia de AWS EC2 con Ubuntu Server, y describe la estrategia de recolección de logs estructurados para su posterior indexación mediante **Splunk**.

---

## 1. Guía de Despliegue Rápido en AWS EC2 (Ubuntu)

### Paso 1: Configurar el Grupo de Seguridad en AWS (Security Group)
Para permitir el tráfico del frontend, del simulador y de las conexiones de los sensores reales, debes abrir los siguientes puertos en las reglas de entrada (*Inbound Rules*) de tu instancia EC2:

| Puerto | Protocolo | Descripción | Origen Recomendado |
| :--- | :--- | :--- | :--- |
| **22** | TCP | Acceso de administración remota SSH | Tu IP Pública |
| **80** | TCP | Acceso Web al Frontend de la plataforma | `0.0.0.0/0` (Público) |
| **1883** | TCP | Protocolo MQTT (Simulador e ingesta de sensores) | `0.0.0.0/0` (o IPs de los dispositivos) |
| **8883** | TCP | Protocolo MQTTS Seguro (TLS) | `0.0.0.0/0` |
| **18083** | TCP | Panel Web de Administración de EMQX (Opcional) | Tu IP Pública |

---

### Paso 2: Inicializar la Instancia de AWS EC2
1. Conéctate a tu instancia EC2 por SSH:
   ```bash
   ssh -i /ruta/tu-clave.pem ubuntu@<IP_PUBLICA_AWS>
   ```
2. Transfiere o crea el script `setup_aws.sh` en el servidor:
   * Puedes subirlo usando `scp`:
     ```bash
     scp -i /ruta/tu-clave.pem setup_aws.sh ubuntu@<IP_PUBLICA_AWS>:~/
     ```
   * O puedes crearlo y pegar el código directamente:
     ```bash
     nano setup_aws.sh
     ```
3. Otorga permisos de ejecución e inicia el script de instalación automática:
   ```bash
   chmod +x setup_aws.sh
   ./setup_aws.sh
   ```
   *El script instalará automáticamente Docker Engine y Docker Compose V2.*

4. **Muy Importante**: Cierra tu sesión SSH actual y vuelve a ingresar para activar los permisos del grupo `docker` sin requerir `sudo`:
   ```bash
   exit
   ssh -i /ruta/tu-clave.pem ubuntu@<IP_PUBLICA_AWS>
   ```

---

### Paso 3: Clonar el Repositorio y Desplegar
1. Clona el repositorio oficial de OmniSens en el servidor de AWS:
   ```bash
   git clone <URL_DEL_REPOSITORIO> omnisens
   cd omnisens
   ```
2. Levanta la infraestructura con Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Verifica el estado de los contenedores:
   ```bash
   docker compose ps
   ```
   *La plataforma ahora estará accesible desde cualquier navegador ingresando la IP pública de AWS (`http://<IP_PUBLICA_AWS>`).*

> [!NOTE]
> **Resolución de Error en npm ci durante la compilación:**
> Si la compilación de la imagen del frontend o backend arroja un error con `npm ci` (exit code: 1), se debe a discrepancias multiplataforma en el archivo `package-lock.json` (por ejemplo, al desarrollar en Windows e intentar construir en contenedores de Alpine Linux).
> Para solucionar esto, las imágenes del proyecto fueron modificadas de `RUN npm ci` a `RUN npm install` en sus respectivos `Dockerfile`, permitiendo que npm resuelva dinámicamente los binarios adecuados para Linux sin fallar. También se agregaron archivos `.dockerignore` para optimizar el peso del contexto de construcción.

> [!WARNING]
> **Error ENOSPC: No space left on device (Sin espacio en disco):**
> Si durante la construcción ves errores del tipo `ENOSPC: no space left on device, write`, significa que el almacenamiento de tu instancia EC2 está lleno (las instancias por defecto en la capa gratuita solo tienen 8 GB de almacenamiento, el cual se agota rápidamente con las capas e imágenes temporales de Docker).
> 
> Para solucionar esto y liberar espacio en la instancia, ejecuta los siguientes comandos en tu terminal de AWS por SSH:
> 1. Limpiar el caché de construcción de Docker (suele liberar gigabytes):
>    ```bash
>    docker builder prune -a -f
>    ```
> 2. Eliminar imágenes y contenedores huérfanos/en desuso:
>    ```bash
>    docker system prune -a -f
>    ```
> 3. Verificar el espacio disponible en disco:
>    ```bash
>    df -h
>    ```
> 4. Si has aumentado el volumen en AWS (por ejemplo, a 16 GB) pero `df -h` sigue mostrando el tamaño antiguo (ej. 6.7 GB) mientras que `lsblk` muestra que la partición es más grande (ej. 14.9 GB), debes expandir el sistema de archivos (filesystem) para que ocupe todo el espacio disponible en la partición:
>    ```bash
>    sudo resize2fs /dev/nvme0n1p1
>    ```
>    *(Una vez ejecutado, vuelve a verificar con `df -h` y verás que el espacio se actualiza inmediatamente a los 15-16 GB asignados).*

---

## 2. Estrategia de Recolección de Logs con Splunk Cloud

### 2.1 Arquitectura y Topología de Ingesta

La estrategia de monitoreo e ingesta de datos de la infraestructura se diseñó bajo un **modelo híbrido** que conecta servicios de Infraestructura como Servicio (IaaS) con Software como Servicio (SaaS). El objetivo principal de esta topología es descentralizar la ejecución de las aplicaciones mientras se centraliza la observabilidad, recolección de logs y analítica en tiempo real.

Para lograr esta integración, la arquitectura se compone de los siguientes elementos y flujos de trabajo:

* **Host de Ejecución (Instancia AWS EC2)**: Actúa como el nodo de cómputo principal donde residen los servicios de la plataforma OmniSens. Los registros de actividad (logs) generados por el sistema operativo y los procesos internos (contenedores Docker) se almacenan temporalmente en el sistema de archivos local de esta instancia.
* **Agente de Recolección (Splunk Universal Forwarder)**: Para evitar sobrecargar la instancia con tareas pesadas de procesamiento de datos, se implementó un agente ligero (Universal Forwarder). Este demonio opera en segundo plano con una huella mínima de CPU y memoria. Su función es realizar un monitoreo continuo (*tailing*) sobre directorios específicos del sistema de archivos, capturar los nuevos eventos en tiempo real, agruparlos y prepararlos para su transmisión.
* **Enrutamiento y Seguridad (Modelo "Push")**: A diferencia de los modelos de recolección tradicionales donde el servidor central consulta a los nodos (*Pull*), esta integración utiliza una arquitectura **Push**. El Universal Forwarder empuja proactivamente los datos hacia Splunk Cloud. Esto representa una ventaja crítica a nivel de ciberseguridad, ya que **no requiere abrir puertos de entrada (Inbound) en el Security Group de AWS**. Toda la comunicación se realiza de forma saliente (*Outbound*).
* **Autenticación Criptográfica**: El túnel de comunicación entre AWS y Splunk Cloud se asegura mediante un paquete de credenciales encriptado (`.spl`). Este archivo, generado directamente por la consola de Splunk Cloud e instalado en el Universal Forwarder, contiene los certificados TLS/SSL y las llaves necesarias para realizar un *handshake* seguro. Esto garantiza que los datos viajen cifrados a través de Internet y que el destino autentique criptográficamente el origen de la información.
* **Capa de Analítica (Splunk Cloud)**: Una vez que los datos cruzan el túnel de forma segura, aterrizan en los *Indexers* de Splunk Cloud, donde son clasificados, parseados (mediante reconocimiento automático del formato JSON) y almacenados de manera persistente, quedando inmediatamente disponibles para su explotación visual mediante el lenguaje de procesamiento SPL.

---

### 2.2 Prerrequisitos (Pasos Manuales del Usuario)

Antes de ejecutar la instalación en tu instancia de AWS, debes descargar y subir las credenciales de cifrado y enrutamiento seguro de tu cuenta de Splunk Cloud:

1. **Descargar el archivo de credenciales**:
   * Ingresa a tu interfaz web de **Splunk Cloud**.
   * Ve al panel de administración y navega a **Apps** (o **App Management**).
   * Busca e instala o selecciona **Universal Forwarder**.
   * Haz clic en **Download Credentials** (esto descargará un archivo llamado `splunkclouduf.spl` en tu PC).

2. **Subir el archivo `.spl` a la instancia de AWS EC2**:
   Usa el comando `scp` en la terminal de tu computadora local para transferir el paquete a la carpeta Home del usuario `ubuntu` en la instancia EC2.
   
   **Sintaxis del Comando SCP:**
   ```bash
   scp -i /ruta/a/tu/llave_aws.pem /ruta/a/descargas/splunkclouduf.spl ubuntu@<IP_PUBLICA_EC2>:/home/ubuntu/
   ```
   *Ejemplo real:*
   ```bash
   scp -i "C:\Users\Fernando\Downloads\omnisens-key.pem" "C:\Users\Fernando\Downloads\splunkclouduf.spl" ubuntu@3.90.242.143:/home/ubuntu/
   ```

---

### 2.3 Script de Instalación y Automatización (`install_splunk_uf.sh`)

Para garantizar que el proceso de despliegue en la EC2 sea reproducible y libre de errores para un evaluador académico, se ha desarrollado un script en bash (`install_splunk_uf.sh`) localizado en la raíz del repositorio.

Este script realiza de forma totalmente automática las siguientes operaciones:
1. **Validación**: Verifica que el archivo de credenciales `splunkclouduf.spl` esté subido en `/home/ubuntu/`.
2. **Descarga**: Obtiene el paquete `.deb` oficial de Splunk Universal Forwarder para Linux de 64 bits.
3. **Instalación**: Instala el agente de Splunk en el sistema usando `dpkg`.
4. **Pre-sembrado de Credenciales**: Genera el archivo `user-seed.conf` para establecer el usuario y la contraseña local del agente de forma desatendida, evitando bloqueos interactivos.
5. **Configuración de Splunk Cloud**: Instala el paquete de credenciales descargado (`splunkclouduf.spl`) vinculando el agente con los endpoints cifrados de Splunk Cloud.
6. **Configuración de Inputs (`inputs.conf`)**: Registra la ruta de logs de los contenedores Docker (`/var/lib/docker/containers/*/*-json.log`) con formato de análisis `_json`.
7. **Privilegios**: Instala la utilidad `acl`, añade al usuario `splunkfwd` al grupo `docker` y concede permisos seguros de lectura sobre la carpeta de contenedores de Docker.
8. **Reinicio**: Asegura el propietario del directorio y reinicia el servicio de Splunk para iniciar el flujo de datos.

#### Contenido del Script (`install_splunk_uf.sh`)
```bash
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
# Añadir splunkfwd al grupo docker
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
```

#### Cómo ejecutar el script en AWS:
1. Conéctate a tu instancia EC2 por SSH.
2. Descarga o crea el archivo del script en la carpeta de usuario:
   ```bash
   nano install_splunk_uf.sh
   # (Pega el código anterior y guarda)
   ```
3. Otorga permisos de ejecución al script:
   ```bash
   chmod +x install_splunk_uf.sh
   ```
4. Ejecuta el script:
   ```bash
   ./install_splunk_uf.sh
   ```

---

### 2.4 Verificación de la Recolección en Splunk Cloud

Una vez que el script se complete con éxito, el Universal Forwarder comenzará a monitorear activamente los logs de Nginx, Fastify API, EMQX Broker y TimescaleDB.

Para verificar que la ingesta funciona correctamente:
1. Abre tu consola web de **Splunk Cloud**.
2. Dirígete a **App: Search & Reporting**.
3. Ejecuta la siguiente consulta SPL (Search Processing Language) en la barra de búsqueda:
   ```spl
   index="omnisens_logs"
   ```
4. Verás las entradas JSON estructuradas en tiempo real de todos los servicios. Puedes filtrar los logs de un microservicio específico usando:
   ```spl
   index="omnisens_logs" "aqi_backend"
   ```
   O para aislar conexiones MQTT sospechosas:
   ```spl
   index="omnisens_logs" "aqi_emqx" "AUTHZ"
   ```
