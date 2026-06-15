# 🔐 Seguridad IoT y Gestión de Vulnerabilidades

## Descripción

Esta carpeta contiene la documentación relacionada con la estrategia de seguridad implementada en OmniSens Industrial Suite. La seguridad constituye un componente fundamental del proyecto debido a que el sistema opera en entornos industriales donde la confiabilidad de la información y la protección de los activos son aspectos críticos para la continuidad operativa.

La documentación aquí presentada forma parte de las actividades desarrolladas dentro del backlog de Seguridad IoT y Gestión de Vulnerabilidades, aplicando principios de Seguridad desde el Diseño (Security by Design) y buenas prácticas de ciberseguridad para sistemas IoT e Industria 4.0.

---

## Documentos incluidos

### 📄 seguridad.md

Documenta la estrategia general de seguridad implementada en OmniSens Industrial Suite.

Contenido:

- Arquitectura de seguridad.
- Protección de dispositivos Edge (ESP32).
- Seguridad en comunicaciones MQTT.
- Seguridad del servidor y servicios Docker.
- Gestión de credenciales.
- Riesgos identificados.
- Estrategias de mitigación.
- Seguridad del ciclo de desarrollo.
- Material de apoyo para presentación.

Objetivo:

Garantizar la confidencialidad, integridad y disponibilidad de la información generada por el sistema.

---

### 📄 validacion_datos.md

Documenta los mecanismos utilizados para garantizar la integridad y confiabilidad de los datos ambientales capturados por los sensores.

Contenido:

- Validación de datos de sensores.
- Detección de anomalías.
- Verificación de rangos permitidos.
- Evaluación de consistencia.
- Controles de integridad.
- Relación con la arquitectura IoT.

Objetivo:

Evitar que datos incorrectos, corruptos o manipulados afecten la toma de decisiones y los procesos de automatización.

---

## Relación con el Proyecto OmniSens

La seguridad en OmniSens no se limita únicamente a la protección de datos digitales. Su propósito es garantizar la confiabilidad de la telemetría, proteger la infraestructura tecnológica y contribuir a la seguridad operativa de los entornos monitoreados.

Las medidas implementadas permiten:

- Reducir riesgos operativos.
- Detectar fallas de sensores.
- Prevenir manipulaciones de datos.
- Proteger las comunicaciones.
- Mejorar la resiliencia del sistema.
- Fortalecer la toma de decisiones basada en información confiable.

---

## Tecnologías Relacionadas

- ESP32
- MQTT
- LoRa
- Docker
- Node-RED
- MariaDB
- Grafana
- GitHub Projects
- GitHub Advanced Security

---

## Estado de la Documentación

✅ Estrategia de Seguridad Documentada

✅ Validación e Integridad de Datos Documentada

✅ Rotación de Credenciales y Gestión de Tokens Documentada

🔄 Documentación en evolución junto con el desarrollo del proyecto.


---

### 📄 rotacion_credenciales.md

Documenta la estrategia de gestión segura de credenciales y renovación de tokens implementada en OmniSens Industrial Suite.

Contenido:

* Política de rotación de credenciales.
* Renovación periódica de tokens.
* Automatización de cambios.
* Revocación de credenciales comprometidas.
* Gestión segura de accesos.
* Aplicación en MQTT, APIs, Docker y Base de Datos.
* Procedimientos documentados de respuesta ante incidentes.

Objetivo:

Reducir los riesgos asociados a la exposición de claves, contraseñas y tokens mediante la utilización de credenciales dinámicas y mecanismos de renovación controlados.

Resultado esperado:

Fortalecer la seguridad del sistema, minimizar el impacto de posibles filtraciones y garantizar una gestión segura de accesos dentro de la arquitectura OmniSens.

