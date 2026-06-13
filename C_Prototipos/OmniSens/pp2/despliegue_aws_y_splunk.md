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

---

## 2. Estrategia de Recolección de Logs con Splunk

Para la recolección centralizada de logs en Splunk, la infraestructura de OmniSens está adaptada para facilitar el trabajo del **Splunk Universal Forwarder** a través del driver nativo de Docker.

### Estructura de Logs de Docker
Todos los contenedores de la plataforma están configurados en el archivo `docker-compose.yml` para utilizar el driver de log `json-file`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### Ventajas de esta configuración:
1. **Prevención de Disco Lleno (Rotación)**: Docker limita el tamaño de cada archivo de logs a `10 Megabytes` y retiene un máximo de `3 archivos` por contenedor. Esto evita que los logs de telemetría e ingesta llenen el almacenamiento de la instancia EC2.
2. **Formato JSON Estructurado**: El driver guarda los logs de la salida estándar (`stdout`/`stderr`) en formato JSON nativo de una sola línea, lo que permite a Splunk parsear automáticamente los campos como `log`, `stream`, y `time`.

### Ruta de logs en el Host de AWS
En la instancia de Ubuntu, Docker guarda físicamente los logs de cada contenedor en la siguiente ruta protegida:
```
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

---

### Integración con Splunk Universal Forwarder
Para enviar estos logs a Splunk, se debe instalar el **Splunk Universal Forwarder** directamente sobre el host de Ubuntu de la instancia EC2 y seguir estos pasos:

1. **Permitir lectura al Forwarder**: El agente de Splunk se ejecuta bajo su propio usuario (`splunk`). Para que pueda leer los logs de Docker, debes añadir el usuario `splunk` al grupo `docker` o configurar permisos de lectura en la carpeta:
   ```bash
   sudo usermod -aG docker splunk
   ```

2. **Configurar `inputs.conf` en Splunk**:
   En el archivo de configuración del Universal Forwarder (`/opt/splunkforwarder/etc/system/local/inputs.conf`), agrega la siguiente sección para monitorizar de forma dinámica todos los logs de los contenedores activos:
   ```ini
   [monitor:///var/lib/docker/containers/*/*-json.log]
   disabled = false
   sourcetype = _json
   index = omnisens_logs
   ```

3. **Configurar `outputs.conf`**:
   Configura el destino de reenvío hacia tu servidor indexador de Splunk (Splunk Enterprise o Splunk Cloud):
   ```ini
   [tcpout]
   defaultGroup = default-autolb-group

   [tcpout:default-autolb-group]
   server = <IP_O_HOST_SPLUNK_INDEXER>:9997
   ```

4. **Reiniciar el Forwarder**:
   ```bash
   sudo /opt/splunkforwarder/bin/splunk restart
   ```

Una vez completado, Splunk comenzará a indexar los eventos de telemetría de base de datos, mensajes del backend de Fastify, conexiones MQTT de EMQX y peticiones web de Nginx en el frontend, todo de manera estructurada y en tiempo real.
