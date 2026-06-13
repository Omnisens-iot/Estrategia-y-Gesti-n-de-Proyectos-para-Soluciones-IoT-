# 📋 Listado de Componentes de Hardware y Recursos para el Presupuesto - OmniSens

Este documento detalla el listado de materiales (BOM - Bill of Materials) y los recursos necesarios para el desarrollo, producción, despliegue y mantenimiento del ecosistema **OmniSens**. La información ha sido recopilada y consolidada a partir del estado de desarrollo actual del proyecto (firmware C++ en PlatformIO, backend de producción en Fastify, frontend en Vue 3 y orquestación con Docker Compose).

---

## 1. Componentes de Hardware (BOM por Nodo Edge)

El nodo de hardware **OmniSens AQC** (Air Quality Controller) está basado en el microcontrolador ESP32 y se encarga del sensado ambiental de múltiples variables, así como del accionamiento local y remoto de actuadores.

A continuación se detallan los componentes individuales de hardware requeridos para la fabricación de **un (1) nodo Edge**:

### 1.1. Unidad de Procesamiento y Comunicaciones
| Componente | Descripción / Modelo Técnico | Función | Conexión / Interfaz | Cantidad |
| :--- | :--- | :--- | :--- | :--- |
| **Microcontrolador** | ESP32 Development Board (NodeMCU-32S / ESP-WROOM-32) | Procesamiento principal, ejecución de tareas FreeRTOS, servidor web local y cliente WiFi/MQTT. | CPU Core | 1 |
| **Módulo LoRa (Opcional/Legacy)** | SX1278 (433 MHz) con antena externa | Enlace de comunicación de largo alcance para áreas sin cobertura WiFi (diseño heredado disponible). | SPI | 1 (Opcional) |

### 1.2. Sensores (Monitoreo Ambiental)
| Componente | Modelo Técnico | Rango / Variable de Medición | Interfaz | Cantidad |
| :--- | :--- | :--- | :--- | :--- |
| **Sensor de Calidad de Aire** | MQ135 | Concentración de gases nocivos (CO2, alcohol, benceno, humo, NOx). | Analógica (GPIO 39) | 1 |
| **Sensor de Temp. y Humedad** | AHT25 (o AHT20/AHT10) | Humedad relativa (0-100%) y temperatura (-40 a 85 °C). Alta precisión. | I2C (SDA 21 / SCL 22) | 1 |
| **Sensor de Presión y Temp.** | BMP280 | Presión barométrica (300-1100 hPa) y temperatura. | I2C (SDA 21 / SCL 22) | 1 |
| **Sensor de Intensidad Lumínica**| BH1750 | Intensidad de luz ambiente (0-65535 Lux). | I2C (SDA 21 / SCL 22) | 1 |
| **Sensor de Polvo / PM2.5** | Sharp GP2Y1010AU0F (o GP2Y1014AU0F) | Concentración de material particulado. | Analógica (AOUT 34 / ILED 4) | 1 |
| **Sensor de Luz Simple** | LDR (Fotorresistencia) | Sensor analógico complementario de luminosidad. | Analógica (GPIO 36) | 1 |
| **Sensor UV (Opcional)** | ML8511 | Intensidad de radiación ultravioleta. | Analógica (GPIO 33) | 1 (Opcional) |

### 1.3. Actuadores y Señalización Local
| Componente | Modelo Técnico | Función | Interfaz | Cantidad |
| :--- | :--- | :--- | :--- | :--- |
| **Módulo de Relés** | Módulo de 2 canales con optoacoplador | Control de cargas de potencia ON/OFF (por ejemplo: extractores, electroválvulas). | Digital (GPIO 33 / GPIO 25) | 1 |
| **Driver PWM** | Transistor MOSFET de potencia (ej. IRF540N) | Regulación de velocidad para motor de ventilación/extractor. | PWM (GPIO 32) | 1 |
| **Baliza Lumínica** | Tira LED RGB WS2812B (NeoPixel) | Indicación visual del estado del AQI (Índice de Calidad de Aire) y alertas del sistema. | Digital (GPIO 39) | 1 |
| **Alarma Sonora** | Buzzer Activo de 5V | Señalización audible de superación de umbrales críticos. | Digital (GPIO 2 / pin compartido) | 1 |
| **Pantalla Local (Opcional)** | Display LCD 16x2 o 20x4 con adaptador I2C | Visualización local de lecturas de sensores para el operador. | I2C (SDA 21 / SCL 22) | 1 (Opcional) |

### 1.4. Alimentación y Misceláneos
| Componente | Tipo / Especificaciones | Función | Cantidad |
| :--- | :--- | :--- | :--- |
| **Fuente de Alimentación** | Transformador switching 110V/220V a 5V DC (mínimo 2A) o fuente industrial riel DIN. | Alimentar la placa ESP32, los relés y los sensores de forma estable. | 1 |
| **PCB a medida** | Placa de circuito impreso de 2 capas (FR4) | Integración física y eléctrica de todos los componentes, bornes y conectores. | 1 |
| **Gabinete / Carcasa** | Caja estanca IP65/IP67 o gabinete riel DIN con partes impresas en 3D (PLA/PETG). | Protección contra intemperie y polvo industrial. | 1 |
| **Elementos de Conexión** | Bornes de tornillo (tipo KF301), headers hembra/macho, cables Dupont, zócalos. | Conectores para fácil mantenimiento de sensores y reemplazo de placa. | 1 set |
| **Botón de Configuración** | Pulsador momentáneo (o uso del botón BOOT integrado) | Acceso físico para gatillar el portal cautivo del `WiFiManager`. | 1 |

---

## 2. Recursos de Infraestructura de Software y Servidores

El presupuesto del proyecto debe incluir el costo de despliegue y mantenimiento mensual/anual de la plataforma en la nube o en servidores locales (*on-premise*).

### 2.1. Entorno de Servidor (Producción Cloud/VPS)
- **Servidor Cloud VPS**: Instancia en proveedores como AWS, DigitalOcean, Linode o Azure.
  - *Requerimientos mínimos*: 2 vCPUs, 4 GB de RAM, 80 GB SSD (para albergar contenedores Docker y datos históricos).
- **Servicio de Respaldos (Backups)**: Almacenamiento automatizado de la base de datos (por ejemplo, AWS S3 o volumen de bloques externo).

### 2.2. Componentes de Software (Stack Tecnológico Open-Source)
No conllevan costos de licencias comerciales directa, pero requieren recursos para administración y hosting:
- **Broker MQTT (EMQX)**: Orquestación del tráfico de mensajes de telemetría y comandos con TLS (Puerto 8883).
- **Base de Datos (TimescaleDB / PostgreSQL)**: Almacenamiento de series temporales altamente optimizado para las métricas recolectadas.
- **Backend API (Fastify / TypeScript)**: Microservicio encargado de la lógica de negocio, autenticación multi-tenant (JWT) y provisionamiento de seguridad (HMAC-SHA256).
- **Frontend Dashboard (Vue 3 / Vite)**: Interfaz de usuario con paneles interactivos e históricos analíticos basados en Apache ECharts.
- **Proxy Inverso y Cifrado (Nginx + Certbot/Let's Encrypt)**: Enrutamiento seguro del tráfico web (HTTPS) y MQTT sobre TLS.

### 2.3. Herramientas de Despliegue e IaC
- **Ansible**: Automatización del despliegue en producción sobre servidores Linux de forma desasistida.
- **Docker y Docker Compose**: Virtualización de todos los servicios para garantizar consistencia entre desarrollo y producción.

---

## 3. Herramientas de Laboratorio y Desarrollo (Inversión Inicial)

Para realizar el armado de prototipos, soldadura, pruebas eléctricas y calibración de sensores se requiere el siguiente equipamiento de laboratorio (inversión única de capital - CAPEX):

- **Instrumental de Medición y Pruebas**:
  - Multímetro digital de precisión (para verificar voltajes de alimentación de sensores de 3.3V y 5V).
  - Osciloscopio digital (opcional, útil para auditar señales PWM y el bus I2C).
  - Fuente de alimentación regulable de laboratorio (0-30V, 0-5A) con limitación de corriente.
- **Herramientas de Ensamblaje y Soldadura**:
  - Estación de soldado regulable en temperatura y extractor de humo.
  - Estaño de buena calidad, flux y mallas desoldadoras.
  - Pinzas de precisión, alicates de corte, pelacables y crimpeadora de conectores.
- **Equipamiento de Fabricación Rápida**:
  - Impresora 3D (tecnología FDM, ej: Ender 3 o similar) y filamento (PETG o ABS por resistencia térmica/química) para la creación de gabinetes y soportes.

---

## 4. Recursos Humanos y Roles de Desarrollo

El desarrollo integral y puesta en marcha del proyecto requiere de un equipo multidisciplinario. En el presupuesto se deben proyectar las horas de desarrollo o salarios para los siguientes perfiles:

1. **Ingeniero de Sistemas Embebidos / Firmware Developer (C++/RTOS)**:
   - *Tareas*: Programación del ESP32, gestión de tareas multihilo en FreeRTOS, lectura no bloqueante de sensores, calibración de sensores analógicos (MQ135, Sharp polvo), implementación del portal cautivo y seguridad de aprovisionamiento por MQTT.
2. **Diseñador de Hardware / PCB Designer**:
   - *Tareas*: Diseño del esquemático del circuito, ruteado de la PCB (dos capas con planos de tierra adecuados), generación de archivos Gerber y optimización para fabricación industrial.
3. **Desarrollador Backend & DBA (Node.js/Fastify/TimescaleDB)**:
   - *Tareas*: Creación de APIs REST, optimización de consultas de series temporales con Kysely/SQL, desarrollo de la estrategia multi-tenant y lógica de seguridad de firmas HMAC-SHA256 para placas.
4. **Desarrollador Frontend (Vue 3/Vite/ECharts)**:
   - *Tareas*: Diseño del portal web responsive, integración de gráficas de alto rendimiento en tiempo real para variables ambientales e interfaz de control de actuadores.
5. **Ingeniero DevOps / SysAdmin**:
   - *Tareas*: Configuración del servidor de producción, despliegue con Docker Compose, automatización con playbooks de Ansible, gestión de certificados SSL (Let's Encrypt), políticas de firewall y hardening del broker EMQX.
6. **Diseñador Industrial (Carcasa 3D)**:
   - *Tareas*: Modelado 3D del gabinete protector, diseño de soportes de sensores para flujo de aire adecuado y preparación de archivos listos para impresión 3D o inyección de plástico.

---

## 5. Costos Operativos de Terceros y Logística (OPEX / CAPEX)

- **Servicios de Fabricación de PCBs**: Fabricación de prototipos y lotes en fábricas especializadas (ej. JLCPCB, PCBWay), incluyendo envío internacional.
- **Servicios de Ensamble (SMT/THT)**: Soldadura manual o automatizada de los componentes en la placa.
- **Servicio de Hosting de Dominios y SSL**: Compra del dominio del proyecto (ej: `.org` o `.com`) y certificados si se requiere una entidad certificadora comercial.
- **Certificaciones (Opcional - Fase Industrial)**: Ensayos de compatibilidad electromagnética (EMC) y certificaciones eléctricas si el producto se comercializa industrialmente.

---
> [!IMPORTANT]
> **Consideración Crítica de Presupuesto:**
> Los sensores analógicos como el **MQ135** y el **Sharp de Polvo (GP2Y1010AU0F)** requieren un tiempo de precalentamiento inicial (burn-in time) y calibraciones periódicas en campo utilizando filtros de media móvil implementados en firmware. Se debe considerar en el presupuesto el costo de calibración y el reemplazo preventivo de los sensores de gas (vida útil estimada de 1.5 a 2 años en ambientes industriales).

> [!TIP]
> **Optimización de Costos en Producción:**
> El aprovisionamiento automático (*Zero-Touch Provisioning*) integrado en el firmware del ESP32 a través de HMAC-SHA256 permite reducir drásticamente los costos de soporte e instalación técnica en campo, ya que los nodos se configuran dinámicamente al conectarse por primera vez a la red WiFi del cliente mediante el portal cautivo.
