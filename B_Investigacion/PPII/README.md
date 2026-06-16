# ☁️ Infraestructura Cloud y Observabilidad (PPII)

## Descripción

Este directorio centraliza el diseño técnico y la arquitectura de infraestructura en la nube para el proyecto **OmniSens Industrial Suite**. El contenido aquí expuesto formaliza el análisis, la orquestación de servicios y la validación de la observabilidad, en cumplimiento con los estándares técnicos y operativos requeridos por la **Práctica Profesionalizante II (PPII)**.

## Documentos incluidos

📄 **4.1 Definir variables a monitorear.docx.pdf**

Documenta la matriz de telemetría y variables críticas capturadas por los nodos perimetrales.
*   **Contenido:**
    *   Definición de matriz de telemetría.
    *   Rangos operativos y lógica de ingesta de datos.
    *   Propósitos industriales de las variables.
*   **Objetivo:**
    *   Establecer la estructura base para el análisis analítico del sistema.

📄 **8.2 Diseñar flujo de datos completo del sistema.docx.pdf**

Documenta la topología lógica y el ciclo de vida del dato desde el Edge hacia la nube.
*   **Contenido:**
    *   Mapeo de la adquisición de datos.
    *   Transporte mediante protocolos MQTT.
    *   Ingesta en la infraestructura centralizada.
*   **Objetivo:**
    *   Validar la integridad del pipeline de datos y garantizar una comunicación eficiente en entornos industriales.

📄 **10.2 Documentar arquitectura técnica final.docx.pdf**

Documenta la especificación formal de la infraestructura cloud integrada y sus procedimientos de despliegue.
*   **Contenido:**
    *   Arquitectura de servicios sobre instancias AWS EC2.
    *   Orquestación de microservicios con Docker.
    *   Gestión de configuración mediante Ansible (IaC).
    *   Mapeo de conectividad y puertos críticos.
*   **Objetivo:**
    *   Consolidar la arquitectura tecnológica escalable y los mecanismos de despliegue automatizado.

🖼️ **Integración_de_monitoreo_en_nube.png**

Documenta la representación visual de la arquitectura de conectividad y observabilidad.
*   **Contenido:**
    *   Esquema topológico de AWS EC2 + Splunk Cloud.
    *   Mapa de puertos de comunicación (SSH, HTTP, TCP).
    *   Diagrama de flujo del Universal Forwarder para logs.
*   **Objetivo:**
    *   Validación gráfica de la arquitectura de red y la trazabilidad de logs.

## Tecnologías Relacionadas

* AWS EC2
* Docker / Docker Compose
* Ansible
* Splunk Cloud
* MQTT / SSH / HTTP

## Estado de la Documentación

✅ Matriz de variables definida

✅ Flujo de datos documentado

✅ Arquitectura de despliegue consolidada

✅ Integración técnica (AWS/Splunk) validada

🔄 Documentación en evolución junto con el desarrollo del proyecto.

*Práctica Profesionalizante II | Tecnicatura Superior en Telecomunicaciones (ISPC).*
