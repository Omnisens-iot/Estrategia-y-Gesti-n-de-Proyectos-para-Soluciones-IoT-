# 📂 OmniSens: Plataforma Edge-to-Cloud de Grado Industrial

**OmniSens** es una plataforma integral de Internet de las Cosas (IoT) diseñada para la captura de telemetría ambiental, automatización remota y gestión de dispositivos en tiempo real. Este repositorio contiene el código fuente completo del proyecto, estructurado para entornos de producción.

---

## 🏗️ Arquitectura Actual de la Plataforma

El sistema ha sido reescrito desde sus prototipos iniciales para cumplir con los más altos estándares de eficiencia, escalabilidad e Infraestructura como Código (IaC). El flujo de trabajo y los componentes tecnológicos son los siguientes:

### 1. 📟 Firmware Edge (Nodo Sensor / Actuador)
- **Hardware:** Microcontrolador **ESP32** interactuando con sensores (MQ135, AHT25, BMP280, LDR) y salidas de potencia (Relés, PWM).
- **Firmware (C++ con FreeRTOS):** Arquitectura *Zero-Blocking* basada en tareas de RTOS. Integración nativa de Watchdog Timer (TWDT) para resiliencia frente a fallas.
- **Red y Portal Cautivo:** Usa `WiFiManager` asíncrono para aprovisionamiento de red sin credenciales hardcodeadas, gatillable mediante hardware (botón BOOT).
- **Directorio:** `/Dispositivos/controlador_edge_v01mqtt/Omnisens_AQC`

### 2. 📡 Capa de Transporte y Aprovisionamiento (MQTT)
- **Broker MQTT:** **EMQX** corriendo en Docker.
- **Zero-Touch Provisioning:** Los dispositivos se auto-registran utilizando su MAC address. El backend verifica en base de datos y provee un token criptográfico dinámico (HMAC-SHA256) limitando el acceso de las placas (Sandboxing mediante ACLs).

### 3. ⚙️ Backend (API y Persistencia)
- **API REST:** Microservicio hiper-rápido construido con **Node.js, TypeScript y Fastify**.
- **Base de Datos:** **PostgreSQL + extensión TimescaleDB** (optimizado para inmensos volúmenes de datos temporales). Operado de forma ligera mediante el query builder `Kysely`.
- **Seguridad:** Middleware Multi-tenant que garantiza el aislamiento de datos entre clientes mediante tokens JWT.
- **Directorio:** `/backend`

### 4. 📊 Frontend (Dashboard)
- **Stack:** **Vue 3 (Composition API) + Vite + Tailwind CSS**.
- **Analíticas:** Integración del motor **Apache ECharts** para renderizado eficiente de historiales de datos masivos.
- **Directorio:** `/frontend`

### 5. 🚀 Despliegue y Orquestación (IaC)
- **Docker Compose:** Todos los servicios (Frontend, Backend, Postgres, EMQX) están unificados en un `docker-compose.yml` maestro ubicado en la raíz.
- **Automatización Ansible:** Playbooks configurados para sincronizar ramas, inyectar credenciales seguras (plantillas `.env.j2`) y reiniciar contenedores en caliente de forma remota sobre nodos Linux.
- **Reverse Proxy:** Plantillas de enrutamiento para Nginx Maestro.
- **Directorio:** `/Despliegue` y `/configuraciones`

---

## 📁 Estructura del Repositorio

| Directorio | Descripción |
| :--- | :--- |
| `/backend` | Código fuente del microservicio Fastify (Node.js/TS). |
| `/frontend` | Código fuente de la Interfaz Web de usuario (Vue/Vite). |
| `/Dispositivos` | Firmware C++ de las placas Edge (PlatformIO). |
| `/Despliegue` | Playbooks de Ansible para la automatización en Producción. |
| `/configuraciones` | Plantillas para Ingress (Nginx) y listas de acceso MQTT (EMQX). |
| `/docs` | Documentación técnica profunda, diccionarios de BD y arquitectura. |
| `/_archive` | Carpeta de legado con componentes y pruebas de concepto de fases iniciales. |

---

## 🔒 Notas de Seguridad
Por razones de seguridad, **no existen credenciales vivas en este repositorio**. 
- En el caso del Firmware, los tokens MQTT son aprovisionados de forma dinámica y la clave WiFi se configura vía portal cautivo.
- En el caso de la Infraestructura, las claves de BD y JWT se inyectan a través de secretos/variables de entorno en el servidor de despliegue mediante plantillas bloqueadas (`.env.j2`).
