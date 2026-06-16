[![omnisens.jpg](https://i.postimg.cc/c48F2xk5/omnisens.jpg)](https://postimg.cc/2VrdBDD4)
# 📋 Especificaciones y Requisitos | OmniSens Industrial Suite

## Descripción
Este directorio centraliza el marco de referencia, los objetivos estratégicos y los criterios de validación que rigen el desarrollo de **OmniSens Industrial Suite**. La información aquí documentada constituye la línea base para la investigación, el prototipado y la presentación final del proyecto.

## Áreas de Competencia Técnica
La arquitectura de **OmniSens** integra los siguientes pilares tecnológicos, cubriendo la totalidad de los ejes temáticos del ABP:

| Área de Trabajo | Foco Técnico |
| :--- | :--- |
| **Infraestructura Cloud** | Orquestación en AWS EC2, contenedores (Docker) y automatización (Ansible). |
| **Seguridad IoT** | Blindaje mediante TLS/ECC y HMAC-SHA256 bajo la tríada CIA. |
| **Inteligencia de Negocio** | Modelo SaaS B2B, validación de mercado y Dashboards estratégicos. |
| **Gestión de Proyectos** | Ciclo de vida (12 semanas), presupuesto ($15,554 USD) y gobernanza de KPIs. |

## Objetivos del Proyecto

### Objetivo General
Desarrollar y desplegar una plataforma integral de monitoreo ambiental industrial de grado corporativo, basada en arquitectura de microservicios, para eliminar la "ceguera operativa" en el sector industrial, garantizando la seguridad laboral y la eficiencia mediante la toma de decisiones basada en evidencia.

### Objetivos Específicos (Ejes del ABP)
* **Infraestructura y Telemetría:** Implementar una red robusta de nodos sensores (AQC) basados en ESP32 para la captura precisa de variables críticas en entornos hostiles.
* **Ciberseguridad Industrial:** Blindar la integridad de los datos mediante protocolos MQTT sobre TLS con certificados ECC y autenticación dinámica HMAC-SHA256.
* **Resiliencia y Observabilidad:** Orquestar el ecosistema mediante contenedores Docker, automatización con Ansible y monitoreo avanzado (SRE) mediante Splunk Cloud.
* **Inteligencia de Negocio:** Desarrollar un Dashboard centralizado que transforme datos crudos en activos estratégicos bajo un modelo SaaS B2B.

## Parámetros de Desempeño y Validación (KPIs)
Para garantizar la calidad de la solución, cada componente de la arquitectura debe satisfacer los siguientes niveles de servicio:

| Categoría | Especificación Técnica |
| :--- | :--- |
| **Latencia (TRAC)** | Tiempo de respuesta ante alertas < 500ms. |
| **Eficiencia Técnica (IET)** | Índice de cumplimiento operativo ≥ 95%. |
| **Integridad (CFD)** | Trazabilidad del flujo de telemetría ≥ 95%. |
| **Confiabilidad (HCC)** | Estado de salud y avance de hitos planificados ≥ 90%. |

## Trazabilidad
Los requisitos aquí documentados son la base para el resto de los módulos del repositorio:
1. **Investigación:** Define el marco teórico para validar los parámetros técnicos.
2. **Prototipos:** Asegura que los componentes desarrollados cumplan con las especificaciones.
3. **Presentación:** Valida los resultados finales contra los KPIs establecidos.

---
*OmniSens Industrial Suite | Especificaciones, Requisitos de Ingeniería y Documentación ABP | ISPC.*
