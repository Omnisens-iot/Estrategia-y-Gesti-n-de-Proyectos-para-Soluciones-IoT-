# 🚀 Guía de Despliegue Paso a Paso (Nube Híbrida) - OmniSens

Esta guía describe el procedimiento detallado para transferir los archivos de orquestación desde tu computadora local hacia la **Raspberry Pi (Nodo de Control)** y posteriormente ejecutar el despliegue automatizado en la **Netbook Atom (Servidor Local)** y en la **instancia EC2 de AWS (Servidor en la Nube)**.

---

## 🗺️ Arquitectura de Despliegue Híbrido

```mermaid
graph TD
    PC[PC de Desarrollo (Local)] -->|1. Transferir Archivos (SCP)| RPi[Raspberry Pi (Nodo de Control con Ansible)]
    RPi -->|2. Despliegue local (SSH)| Netbook[Netbook Atom (Servidor Local - Red Interna)]
    RPi -->|3. Despliegue nube (SSH + PEM)| AWS[AWS EC2 (Servidor de Producción en Nube)]
```

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de contar con:
1. La clave privada `.pem` de AWS en tu Raspberry Pi (o lista en tu PC para transferirla).
2. Los accesos SSH habilitados tanto en la Netbook Atom como en la instancia EC2.
3. Ansible instalado en la Raspberry Pi.

---

## 🛠️ Paso a Paso del Despliegue

### Paso 1: Copiar los Archivos de Despliegue a la Raspberry Pi
Debido a que estás trabajando en tu PC local, debes transferir la carpeta de despliegue (`Despliegue/`) y la carpeta de configuraciones de Nginx (`configuraciones/`) a la Raspberry Pi.

Abre una terminal (PowerShell o Git Bash) en tu PC local en la raíz del proyecto `OmniSens/` y ejecuta el comando `scp`:

```bash
# Copia ambas carpetas al home del usuario 'pi' en la Raspberry Pi
# (Reemplaza <IP_RASPBERRY> con la dirección IP real de tu Raspberry Pi)
scp -r Despliegue/ configuraciones/ pi@<IP_RASPBERRY>:/home/pi/omnisens_deploy/
```

> [!TIP]
> Si tu clave `.pem` de AWS está en la PC local, aprovecha para enviarla también a la Raspberry Pi:
> `scp ruta/de/tu/clave.pem pi@<IP_RASPBERRY>:/home/pi/.ssh/omnisens-aws.pem`

---

### Paso 2: Conectarse y Configurar la Raspberry Pi
Conéctate por SSH a la Raspberry Pi:
```bash
ssh pi@<IP_RASPBERRY>
cd /home/pi/omnisens_deploy/Despliegue/
```

Si aún no tienes la clave `.pem` en la ubicación correcta o con los permisos adecuados en la Pi, ejecuta:
```bash
# Mover la llave y ajustar permisos para que SSH la acepte
chmod 400 /home/pi/.ssh/omnisens-aws.pem
```

---

### Paso 3: Configurar el Inventario (`inventory.ini`)
Abre el archivo de inventario en la Raspberry Pi para editarlo (por ejemplo, con `nano inventory.ini`) y completa las direcciones IP reales:

```ini
[nodos_atom]
# Servidor local
netbook_local ansible_host=<IP_NETBOOK_LOCAL> ansible_user=fernandogc

[nodos_aws]
# Servidor en la nube
aws_ec2 ansible_host=<IP_PUBLICA_AWS> ansible_user=ubuntu ansible_ssh_private_key_file=/home/pi/.ssh/omnisens-aws.pem
```

> [!NOTE]
> Si la instancia de AWS corre **Amazon Linux 2 / RHEL** en lugar de **Ubuntu**, debes cambiar `ansible_user=ubuntu` por `ansible_user=ec2-user`.

---

### Paso 4: Validar Conectividad desde Ansible
Antes de desplegar, verifica que la Raspberry Pi pueda comunicarse mediante Ansible con ambos servidores:

```bash
# Realiza un ping de Ansible a todos los nodos del inventario
ansible -i inventory.ini all -m ping
```
*Si todo está bien, deberías ver una respuesta en color verde (`SUCCESS`) para ambos nodos.*

---

### Paso 5: Ejecutar el Playbook de Despliegue
Ejecuta el despliegue automático. Este comando aprovisionará la instancia de AWS (instalando Docker, Compose y Git) y luego compilará/levantará el stack en ambos entornos:

```bash
ansible-playbook -i inventory.ini deploy_aqi.yml
```

---

## 🔍 Paso 6: Verificación de los Microservicios

### En el Entorno Local (Netbook Atom)
1. Conéctate a la netbook y verifica que los contenedores estén corriendo:
   ```bash
   docker ps
   ```
2. Asegúrate de que la red externa `omni_agro_omnisens_net` esté activa y contenga los contenedores:
   ```bash
   docker network inspect omni_agro_omnisens_net
   ```
3. El frontend de la netbook no expone puertos externos al host, por lo que el tráfico web debe ingresar a través de tu Nginx Maestro en el puerto `80/443` utilizando la plantilla `configuraciones/aqi.conf.j2`.

### En el Entorno de AWS
1. Conéctate a la instancia de AWS y confirma los contenedores:
   ```bash
   docker ps
   ```
   *Deberías ver los puertos expuestos (ej. `0.0.0.0:80->80/tcp` para el frontend y los puertos de EMQX).*
2. Abre tu navegador y accede al Dashboard ingresando la IP pública de AWS:
   `http://<IP_PUBLICA_AWS>`
3. Verifica el acceso al panel de administración de EMQX:
   `http://<IP_PUBLICA_AWS>:18083` (Usuario por defecto: `admin` / Clave: `public`).

---
> [!IMPORTANT]
> **Seguridad en AWS:** Asegúrate de abrir los puertos de entrada (`80`, `1883`, `8883` y `18083` para administración) en el **Security Group (Grupo de Seguridad)** asociado a tu instancia EC2 en la consola de AWS para permitir las conexiones externas.
