# Walkthrough - Hito 5: Orquestación y Despliegue Automatizado (IaC)

Se ha implementado el aprovisionamiento y despliegue dinámico en nube híbrida para la plataforma **OmniSens**. A continuación se detallan la estructura de archivos, las modificaciones realizadas y los pasos para ejecutar el despliegue desde la Raspberry Pi (Nodo de Control).

## Estructura de la Carpeta de Ansible y Despliegue

Los archivos se organizan dentro del repositorio de la siguiente manera:

```text
OmniSens/
├── docker-compose.yml                          # Archivo de Docker Compose base (común)
├── Despliegue/
│   ├── inventory.ini                           # Inventario de hosts (Local Atom y AWS EC2)
│   ├── deploy_aqi.yml                          # Playbook maestro de Ansible
│   ├── .env.j2                                 # Plantilla de variables de entorno (.env)
│   ├── docker-compose.override.local.yml.j2    # Override de Compose para el entorno local
│   ├── docker-compose.override.aws.yml.j2      # Override de Compose para AWS
│   └── Readme.md
└── configuraciones/
    ├── aqi.conf.j2                             # Plantilla de Nginx Maestro para Local
    └── emqx_acl.conf                           # Reglas de control de acceso para MQTT (EMQX)
```

---

## Archivos Modificados e Creados

### 1. [inventory.ini](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/Despliegue/inventory.ini) [NEW]
Define dos grupos de hosts (`nodos_atom` para local y `nodos_aws` para nube), especificando las IPs, los usuarios del sistema (`fernandogc` y `ubuntu` respectivamente) y el archivo de clave privada `.pem` requerido para AWS.

### 2. [docker-compose.yml](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docker-compose.yml) [MODIFY]
Se reestructuró para servir como archivo base. Define la red `omnisens_net` como interna (`driver: bridge`) y elimina cualquier exposición de puertos en los servicios para que sea dinámico.

### 3. [docker-compose.override.local.yml.j2](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/Despliegue/docker-compose.override.local.yml.j2) [NEW]
Configura el compose para que reemplace la red interna por la red compartida externa `omni_agro_omnisens_net` en el nodo local, sin exponer puertos directamente al host (Nginx Maestro enruta el tráfico).

### 4. [docker-compose.override.aws.yml.j2](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/Despliegue/docker-compose.override.aws.yml.j2) [NEW]
Expone los puertos públicos de Internet en AWS: puerto `80` para el Frontend, y puertos `1883`, `8883` y `18083` para el Broker EMQX.

### 5. [deploy_aqi.yml](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/Despliegue/deploy_aqi.yml) [MODIFY]
Playbook modularizado en dos fases (Plays):
- **Play 1 (Aprovisionamiento - Solo AWS)**: Se conecta a la instancia virgen de AWS y mediante un script oficial instala Docker, Docker Compose V2 y Git.
- **Play 2 (Despliegue - Ambos)**: Clona el repositorio público vía HTTPS, genera el archivo `.env` dinámico, inyecta la plantilla `docker-compose.override.yml` correcta para cada entorno, crea la red externa local de ser necesario y levanta los servicios.

### 6. [aqi.conf.j2](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/configuraciones/aqi.conf.j2) [MODIFY]
Se actualizó la plantilla del proxy inverso local especificando las conexiones internas de Docker `http://aqi_frontend:80` para enrutar el tráfico web y la API de forma aislada y segura.

---

## Instrucciones de Ejecución desde la Raspberry Pi (Nodo de Control)

### 1. Preparación de Credenciales de AWS en la Raspberry Pi
Asegúrate de copiar tu llave privada de AWS en la Raspberry Pi y de configurar los permisos correctos:
```bash
cp /ruta/de/tu/clave/omnisens-aws.pem ~/.ssh/omnisens-aws.pem
chmod 400 ~/.ssh/omnisens-aws.pem
```

### 2. Modificación del Inventario
Edita el archivo `Despliegue/inventory.ini` para ingresar la IP local de tu Netbook Atom y la IP pública asignada a la instancia EC2 de AWS.
```ini
# Despliegue/inventory.ini
[nodos_atom]
netbook_local ansible_host=TU_IP_NETBOOK_LOCAL ansible_user=fernandogc

[nodos_aws]
aws_ec2 ansible_host=TU_IP_PUBLICA_AWS ansible_user=ubuntu ansible_ssh_private_key_file=/home/pi/.ssh/omnisens-aws.pem
```

### 3. Ejecutar el Playbook
Desde la Raspberry Pi, sitúate en la carpeta `Despliegue` y ejecuta el comando de Ansible:
```bash
ansible-playbook -i inventory.ini deploy_aqi.yml
```

> [!TIP]
> **Verificación de Sintaxis**: Puedes validar la estructura del playbook antes de lanzarlo usando:
> `ansible-playbook -i inventory.ini deploy_aqi.yml --syntax-check`
