[![c491f1d4-f64d-4af9-8f3a-d395638ccc71.png](https://i.postimg.cc/VLDpSDfx/c491f1d4-f64d-4af9-8f3a-d395638ccc71.png)](https://postimg.cc/BXPMk51p)

## OmniSens IoT – Sistema Orientado al Monitoreo y Control Ambiental en Entornos Industriales ##

**OmniSens** es un sistema orientado al monitoreo y control ambiental en entornos industriales. Utiliza sensores para medir variables críticas como temperatura, humedad, presión y luminosidad, y transmite estos datos mediante tecnología **LoRa** hacia un servidor en la nube, permitiendo monitoreo y gestión en tiempo real.

---

## 🧑‍💻 Integrantes

| Nombre                        | GitHub                                 |
|------------------------------|----------------------------------------|
| Fernando Gimenez Coria       | [@FerCbr](https://github.com/FerCbr) |
| Paola Pantoja                | [@PaolaaPantoja](https://github.com/PaolaaPantoja) |
| Diego Ares                   | [@diegote7](https://github.com/diegote7) |
| Macarena Aylèn Carballo      | [@MacarenaAC](https://github.com/MacarenaAC) |
| Raul Jara                    | [@r-j28](https://github.com/r-j28) |
---

## 👨‍🏫 Profesores

| Nombre                        | GitHub                                 |
|------------------------------|----------------------------------------|
| Mario Gonzalez               | [@mariogonzalezispc](https://github.com/mariogonzalezispc) |
| Ana Farias                   |                                        |
| Dante Violi                  |                                        |
| Alejandro DI Marco           |                                        |


## Descripción General

El objetivo principal de OmniSens es implementar un sistema integral capaz de mantener condiciones óptimas de ambiente, garantizando la seguridad y calidad del aire. Para ello, el sistema incluye una serie de **controladores edge** que reciben los datos de los sensores y accionan dispositivos como extractores de aire, luces, alarmas sonoras y balizas luminosas.  
Las acciones de los controladores edge buscan regular parámetros ambientales: por ejemplo, ajustar la velocidad de extractores/ventiladores, la intensidad de luces, o activar alarmas cuando los valores de gases o variables ambientales sobrepasen los límites establecidos.

Los controladores edge se comunican mediante un enlace LoRa hacia otro controlador encargado de funcionar como **nodo concentrador**, formando una red de tipo estrella.  
Este **nodo concentrador** envia a su vez todos datos recolectados a un **broker MQTT** remoto para su posterior analisis y almacenamiento. Esta arquitectura otorga la posibilidad de implementar analisis de datos a nivel de edge, permitiendo reaccionar a variables criticas con baja latencia, sin dejar de lado el procesamiento en la nube, que se encarga de almacenar todos los sucesos y tambien enviar ordenes a los controladores Edge.   


Toda la información recolectada se analiza en un servidor remoto y es almacenada en una base de datos configurada para este fin, luego se procede a mostrar la informacion en un dashboard. Este diseño permite visualizar la informacion procesada a su vez que puede enviar ordenes automaticas o comandos indicados por el usuario.

El proyecto busca aprovechar prototipos y desarrollos previos, adaptando y escalando el enfoque hacia la gestión ambiental industrial. Además, se promueve el trabajo colaborativo y la comunicación de avances con los profesores para su evaluación.

---
## 🧭 1. Introducción y Problemática

**OmniSens** es un sistema de monitoreo y control ambiental industrial desarrollado por estudiantes del módulo **Programador FullStack IoT** del ISPC. Este proyecto integra tecnologías de hardware, software y comunicaciones para adquirir, almacenar, visualizar y actuar sobre datos ambientales críticos en tiempo real.

En entornos industriales, controlar variables como la **temperatura**, **humedad**, **presión atmosférica** y **luminosidad** es fundamental para garantizar la seguridad operativa, la eficiencia energética y el cumplimiento de normativas. Sin embargo, muchas industrias carecen de sistemas inteligentes que permitan:

- 📉 Monitoreo en tiempo real de las condiciones ambientales.
- ⚠️ Detección temprana de riesgos operativos.
- 📄 Registro y trazabilidad de datos históricos.
- 📊 Análisis automatizado y toma de decisiones basada en datos.
- 🚫 Evitar decisiones basadas en intuición o registros incompletos.

Ante este contexto, **OmniSens** surge como una solución tecnológica que permite:

- Capturar datos desde sensores distribuidos mediante nodos IoT (ESP32).
- Transmitir los datos a través de redes como **LoRa** y **WiFi** usando protocolos como **MQTT**.
- Almacenarlos de forma estructurada en una base de datos relacional.
- Visualizarlos y analizarlos en dashboards en tiempo real mediante herramientas como **Grafana** y **NodeRed**
- Generar alertas automáticas y activar actuadores ante condiciones críticas.

El proyecto busca resolver necesidades concretas del sector industrial, promoviendo el desarrollo de competencias profesionales como la integración de sistemas embebidos, la conectividad IoT, la gestión de datos y la visualización inteligente.

> "OmniSens nace para transformar datos ambientales en decisiones inteligentes, aportando valor real a la industria a través de la tecnología."

---
## 🧱 2. Diseño de Arquitectura IoT

El sistema OmniSens está basado en una arquitectura IoT distribuida y escalable, compuesta por sensores físicos, nodos de adquisición (ESP32), un gateway central, servicios backend y plataformas de visualización. Su diseño busca asegurar confiabilidad, modularidad y bajo consumo energético.

### 🔧 Componentes principales de la arquitectura:

- **Sensores ambientales**: capturan variables como temperatura, humedad, presión y luminosidad.
- **Microcontroladores ESP32**: actúan como nodos sensores, adquiriendo y transmitiendo los datos.
- **Red de comunicación**: se utilizan tecnologías inalámbricas como **LoRa** (para distancias largas y bajo consumo) y **WiFi** (para conectividad local con el servidor).
- **Broker MQTT**: intermedia la comunicación entre nodos y backend.
- **Servidor Backend**: recibe, valida y almacena los datos en una base relacional (MySQL/MariaDB).
- **Base de datos**: registra las mediciones por timestamp, dispositivo y variable.
- **Dashboard de visualización**: mediante **Grafana** o/y **Node-Red**, permite observar en tiempo real el estado ambiental.

---
### 🧩 Diagrama lógico de la arquitectura:

plaintext
[Sensores] 
    ↓ 
[ESP32 (Nodo Sensor)] 
    ↓ LoRa / WiFi 
[Gateway MQTT / Servidor] 
    ↓ 
[Base de Datos MySQL] 
    ↓ 
[Dashboard (Grafana / Power BI)]

---
## 🔧 3. Adquisición de Datos (ESP32 + Sensores)

La etapa de adquisición de datos en el sistema OmniSens se basa en la utilización de microcontroladores **ESP32**, que permiten la conexión directa con sensores ambientales y la recolección de datos físicos en tiempo real.


### 🔍 Variables monitoreadas:
- 🌡️ **Temperatura**
- 💧 **Humedad relativa**
- 🌀 **Presión atmosférica**
- 💡 **Luminosidad**

### 🛠️ Componentes utilizados:
- **Sensores digitales y analógicos**:
  - DHT11 → temperatura y humedad
  - BMP280 → presión
  - BH1750 → luminosidad
- **Microcontrolador**:
  - ESP32 (con conectividad WiFi y/o LoRa)

### ⚙️ Flujo de funcionamiento:
1. Los sensores capturan datos del entorno físico.
2. El ESP32 lee las señales de los sensores a través de sus entradas GPIO.
3. El firmware del ESP32 convierte los datos a formato digital y los estructura en mensajes JSON.
4. Los datos se transmiten vía WiFi o LoRa hacia el backend o gateway.

### 🧪 Validación y pruebas realizadas:
- Lectura y calibración de cada sensor.
- Verificación del formato y frecuencia de los datos.
- Simulación de condiciones ambientales para validar variabilidad.
- Comprobación del consumo energético por nodo.

### 📌 Ventajas de usar ESP32:
- Bajo consumo energético.
- Capacidad de procesamiento local.
- Conectividad múltiple: WiFi, Bluetooth, LoRa (mediante módulos).
- Compatibilidad con entornos industriales y educativos.

> Esta etapa permite digitalizar el entorno físico y convertir condiciones ambientales en datos útiles, siendo el punto de partida del sistema de monitoreo y control de OmniSens.

---
## 📡 4. Comunicación Inalámbrica

La transmisión de datos en OmniSens se realiza mediante redes inalámbricas optimizadas para entornos industriales. Se utilizan dos tecnologías principales: **LoRa** y **WiFi**, complementadas por el protocolo **MQTT** para la mensajería entre dispositivos y el servidor.

### 🛰️ Tecnologías de comunicación utilizadas:

- **LoRa (Long Range)**:
  - Permite comunicación de largo alcance con bajo consumo energético.
  - Ideal para entornos con múltiples nodos distribuidos o con baja infraestructura de red.
  - Se utiliza principalmente entre nodos sensores y el nodo receptor (gateway).

- **WiFi**:
  - Usado en el nodo central para conectarse a internet y enviar los datos al backend.
  - Permite alta velocidad de transmisión y bajo retardo.

- **MQTT (Message Queuing Telemetry Transport)**:
  - Protocolo ligero ideal para IoT.
  - Permite que los dispositivos **publiquen** datos en un “topic” y que el servidor **se suscriba** para recibirlos.
  - Asegura eficiencia en redes de bajo ancho de banda y con múltiples dispositivos.

### 🔄 Flujo de comunicación:

plaintext
[ESP32 Nodo Sensor]
  ↓ LoRa
[ESP32 Nodo Receptor / Gateway]
  ↓ MQTT sobre WiFi
[Broker MQTT]
  ↓
[Servidor Backend]

---
## 🖥️ 5. Backend y Base de Datos

El backend del sistema OmniSens cumple un rol central en la recepción, validación, almacenamiento y organización de los datos ambientales enviados por los nodos sensores.

### 🔙 Funciones principales del backend:

- Recibir datos desde los nodos mediante HTTP o MQTT.
- Validar formato, integridad y valores de los datos.
- Registrar eventos o comandos generados por el sistema.
- Almacenar toda la información en una base de datos relacional.
- Exponer APIs para futuras integraciones con dashboards u otros servicios.

### 🧩 Arquitectura del backend:

- **Lenguaje/entorno**: Node.js
- **Servidor web/API**: Express
- **Base de datos**: MariaDB / MySQL
- **Gestión de datos**: Sequelize u ORM nativo
- **Contenedores**: Docker (opcional, según implementación)

### 🗄️ Modelo de Base de Datos Relacional

Se diseñó una base de datos optimizada para registrar información ambiental por dispositivo y variable. Las tablas principales son:

| Tabla | Propósito |
|-------|-----------|
| `devices` | Registra cada ESP32 con su ID, tipo y ubicación. |
| `sensor_data` | Almacena las mediciones de variables con timestamp. |
| `commands_log` | Guarda las acciones o respuestas generadas por el sistema (automatizaciones). |
| `alerts` *(opcional)* | Registra alertas generadas por condiciones críticas. |

#### 🔗 Relaciones entre tablas:
- `devices.device_id` → se relaciona con `sensor_data.device_id` y `commands_log.device_id`
- `sensor_data.id` → puede relacionarse con `alerts.sensor_data_id`

### 🧪 Validaciones implementadas:

- Comprobación de rangos válidos (ej.: temperatura entre -40 °C y 85 °C).
- Eliminación de registros duplicados.
- Control de campos nulos o mal formateados.
- Registro de errores y eventos especiales.

### 📈 Ventajas del diseño:

- Escalable a nuevos sensores y tipos de variables.
- Compatible con visualizadores como Grafana y Power BI.
- Preparado para trazabilidad, alertas y análisis histórico.

> Este backend permite que los datos ambientales capturados por los sensores se conviertan en información estructurada, confiable y accesible para su posterior visualización y análisis.

---
## 📊 6. Visualización Web / Dashboard

La visualización de datos es el paso final del sistema OmniSens, donde la información almacenada en la base de datos es transformada en gráficos, paneles e indicadores comprensibles para facilitar la toma de decisiones.

## 📊 Integración con Node-RED y Grafana

### Node-RED

* Flujo: MQTT → procesamiento → UI → actuador.
* Ruta: `/nodered_plata/ui/`: [Dashboard UI](http://telecomunicaciones.ddns.net:8080/nodered_plata/ui/#!/0)
* Incluye botones para control manual, recepción de datos, lógica de automatización.

### Grafana

* Plataforma de visualización en tiempo real, conectada directamente a la base de datos MySQL.
* Dashboards visuales conectados a base de datos.
* Panel con temperatura, gas, humedad y estado de actuadores.
* Ruta directa:
  [Dashboard público](http://telecomunicaciones.ddns.net:8080/grafana/public-dashboards/edbcf99f6c3e44a68703f5246ecef087)

---

### 🧭 Objetivos de la visualización:

- Representar variables ambientales críticas de forma clara y dinámica.
- Permitir monitoreo en tiempo real de sensores distribuidos.
- Detectar tendencias, anomalías o condiciones fuera de rango.
- Mejorar el mantenimiento, la eficiencia energética y la seguridad operativa.
- Facilitar el análisis por parte de diferentes perfiles de usuarios (técnicos, operativos, directivos).

### 🧱 Estructura del panel:

El dashboard se organiza en múltiples secciones:

1. **Vista general de variables**:
   - Temperatura, humedad, presión y luminosidad por dispositivo.
   - Estado actual, valores máximos y mínimos recientes.

2. **Panel comparativo por sectores o nodos**:
   - Comparación de valores entre ubicaciones o dispositivos.

3. **Alertas y condiciones críticas**:
   - Visualización de alertas activas por umbrales excedidos.

4. **Históricos y tendencias**:
   - Gráficos de evolución temporal de cada variable.
   - Filtros por fecha, nodo o variable.

5. **Indicadores clave (KPIs)**:
   - Promedios, máximos/mínimos diarios.
   - Cantidad de alertas, condiciones óptimas mantenidas, etc.

### 🔗 Conexión de datos:

- **Grafana**: se conecta directamente a la base MySQL mediante consultas SQL configuradas por variable y tabla.
- **Power BI**: importa los datos desde MySQL o desde archivos exportados, permitiendo modelado, limpieza y relaciones personalizadas.

> La visualización convierte datos técnicos en información útil y clara, permitiendo interpretar el comportamiento ambiental y tomar decisiones informadas en entornos industriales.

---
## 🤖 7. Automatización y Control (Actuadores)

Además de monitorear el ambiente, el sistema OmniSens es capaz de **actuar automáticamente** ante condiciones críticas, gracias a la integración de actuadores controlados desde el backend o en forma autónoma por los nodos.

### ⚙️ Objetivos del control automatizado:

- Generar respuestas inmediatas ante variables fuera de rango.
- Activar dispositivos que mejoren las condiciones ambientales.
- Reducir la necesidad de intervención humana.
- Aumentar la seguridad y eficiencia operativa.

### 🔌 Tipos de actuadores posibles:

- 🌀 Ventiladores / extractores de aire.
- 💡 Luces de advertencia o balizas.
- 🔔 Alarmas sonoras.
- 💧 Válvulas o bombas de agua.
- 🌡️ Aire acondicionado o calefactores.

### 🔁 Lógica de automatización:

El sistema puede actuar de dos formas:

#### 1. **Automatización local en ESP32**:
- El ESP32 analiza el dato leído y, si supera un umbral, activa directamente el actuador conectado.
- Ejemplo: si `temperatura > 30°C`, activar ventilador.

#### 2. **Automatización centralizada desde el backend**:
- El servidor recibe los datos y decide activar o no un actuador según reglas definidas.
- Se envía un comando vía MQTT/HTTP al nodo actuador correspondiente.

### 🗂️ Registro de acciones:

- Cada acción ejecutada se guarda en la tabla `commands_log`, con información como:
  - `device_id`
  - `command` (ej. "ON", "OFF")
  - `timestamp`
  - `status`

### 🧪 Validación y pruebas:

- Ensayos de latencia entre detección y acción.
- Pruebas con sensores simulados y actuadores reales.
- Comprobación de fallos: qué ocurre si el actuador no responde.

### 🔒 Seguridad:

- Se pueden establecer reglas para evitar activaciones innecesarias.
- Control de prioridad y bloqueo si hay condiciones simultáneas.

> La automatización convierte al sistema en una herramienta activa, no solo de monitoreo, sino también de respuesta inteligente ante condiciones que afectan el ambiente de trabajo.

---
## 📅 8. Cronograma y Proceso de Desarrollo

El desarrollo del proyecto OmniSens se organizó en etapas semanales, siguiendo una planificación basada en objetivos específicos y acciones técnicas. Esto permitió avanzar de forma progresiva, validando cada componente del sistema antes de integrarlo.

### 📌 Organización por semanas

| Semana | Objetivo principal | Acciones realizadas |
|--------|--------------------|---------------------|
| **Semana 1** | Diseñar la arquitectura | - Análisis de necesidades del sistema<br>- Selección de topología IoT<br>- Definición de roles: sensores, nodos, gateway, servidor<br>- Primeros diagramas de arquitectura |
| **Semana 2** | Adquisición de datos | - Conexión de sensores al ESP32<br>- Programación de firmware básico<br>- Pruebas de lectura y calibración<br>- Validación de datos físicos |
| **Semana 3** | Comunicación inalámbrica | - Configuración de red LoRa y WiFi<br>- Implementación de MQTT/HTTP<br>- Pruebas de transmisión nodo → servidor<br>- Ajustes de cobertura y latencia |
| **Semana 4** | Backend y base de datos | - Diseño de la base de datos relacional<br>- Creación de APIs de recepción<br>- Almacenamiento de datos desde nodos<br>- Gestión de errores y alertas |
| **Semana 5** | Visualización y pruebas finales | - Diseño del dashboard (Grafana / Power BI)<br>- Conexión al backend y base de datos<br>- Visualización de datos en tiempo real<br>- Revisión, ajustes y documentación final |

### 🛠️ Metodología aplicada:

- Trabajo colaborativo entre 9 integrantes, con roles distribuidos.
- Validación continua en cada etapa (sensado, transmisión, backend, visualización).
- Uso de control de versiones (GitHub) para gestionar avances y código.
- Documentación técnica elaborada de forma simultánea al desarrollo.

### 📈 Resultados destacados:

- Se logró un sistema funcional y escalable.
- Todas las etapas del ciclo de vida de los datos fueron cubiertas: captura, transmisión, almacenamiento, análisis y visualización.
- Se presentaron avances periódicos en cada instancia del módulo FullStack IoT.

> El trabajo organizado y en equipo fue clave para alcanzar un producto sólido, demostrando competencias técnicas y metodológicas aplicadas al desarrollo de sistemas IoT reales.

---
## ✅ 9. Conclusión, Aplicaciones y Cierre

OmniSens es el resultado de un trabajo colaborativo y multidisciplinario que integra tecnologías de IoT, comunicaciones, desarrollo de software y análisis de datos para resolver una problemática concreta del ámbito industrial: la necesidad de monitorear y controlar variables ambientales de forma precisa y en tiempo real.

### 🎯 Logros alcanzados:

- Desarrollo de un sistema completo y funcional.
- Integración de sensores físicos y nodos ESP32 con conectividad LoRa/WiFi.
- Implementación de un backend capaz de recibir, validar y almacenar datos.
- Construcción de dashboards interactivos para visualización en tiempo real.
- Automatización de respuestas ante condiciones críticas.
- Trabajo en equipo con documentación técnica, planificación y uso de herramientas profesionales.

### 🏭 Posibles aplicaciones reales:

- **Industria manufacturera**: monitoreo ambiental en líneas de producción.
- **Centros educativos o de investigación**: como plataforma de aprendizaje IoT.
- **Agricultura inteligente**: control ambiental en invernaderos o hidroponía.
- **Municipios**: estaciones ambientales urbanas para políticas públicas.
- **Cooperativas o pymes**: bajo costo, alta utilidad para la toma de decisiones.

### 🌱 Impacto del proyecto:

- Promueve la **conciencia ambiental industrial**.
- Desarrolla habilidades reales del perfil técnico FullStack IoT.
- Facilita la **transferencia tecnológica** a contextos locales.
- Aporta una solución escalable, replicable y con impacto social.

### 🧠 Reflexión final:

> “OmniSens no solo mide condiciones ambientales. Permite que la industria tome decisiones más inteligentes, eficientes y sostenibles. Nos permitió aplicar conocimientos concretos de arquitectura IoT, plataformas web, sistemas de control y gestión de datos, demostrando cómo la tecnología puede mejorar entornos reales.”

