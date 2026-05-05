# 🌍 OmniSens - Sistema de Monitoreo Ambiental IoT

## 📌 Descripción del Proyecto

OmniSens es una solución de monitoreo y control ambiental basada en IoT orientada a entornos industriales, ciudades inteligentes y aplicaciones residenciales. 

Permite capturar variables críticas del entorno, procesarlas en tiempo real y ejecutar acciones automáticas que mejoran la seguridad, eficiencia operativa y toma de decisiones.

---

## 🎯 Objetivos

- Monitoreo multivariable (temperatura, humedad, presión, gases, luminosidad)
- Automatización de actuadores (extractores, alarmas, relays)
- Visualización en tiempo real mediante dashboards
- Generación de datos históricos para análisis
- Mejora de seguridad operativa

---

## 🧠 Arquitectura del Sistema

El sistema se basa en una arquitectura de 3 capas:

### 🔹 Edge (Nodos ESP32)
- Lectura de sensores
- Procesamiento local
- Activación de actuadores

### 🔹 Red (LoRa + MQTT)
- Comunicación de largo alcance
- Baja latencia para eventos críticos

### 🔹 Servidor (Docker)
- Node-RED (lógica)
- MariaDB (persistencia)
- Grafana (visualización)

---

## 🔄 Flujo de Datos

Sensor → ESP32 → LoRa → MQTT → Node-RED → Base de datos → Grafana

---

## ⚙️ Metodología de Trabajo

Se implementa una metodología ágil basada en:

- Kanban (GitHub Projects)
- Gestión mediante Issues
- Organización por Milestones
- Seguimiento de tareas por estados

---

## 📊 Tablero de Gestión

El proyecto se gestiona mediante un tablero Kanban con las siguientes columnas:

- Backlog
- Por hacer
- En progreso
- En revisión
- Bloqueado
- Hecho

---

## 🧩 Organización del Equipo

- Coordinación general del proyecto
- Desarrollo embebido (ESP32)
- Backend y comunicaciones
- Gestión de datos y visualización
- Documentación y presentación

---

## 💰 Modelo de Negocio

OmniSens adopta un modelo híbrido:

- Suscripción mensual (SaaS)
- Servicios de análisis para empresas
- Plataforma para integración con terceros

Segmentos:
- Residencial
- Corporativo (B2B)
- Gobierno / Smart Cities

---

## 🔐 Seguridad

Se implementan medidas de seguridad en múltiples niveles:

- Protección de credenciales
- Cifrado en comunicaciones (TLS/SSL)
- Autenticación en API
- Validación de datos
- Análisis de vulnerabilidades

---

## ⚠️ Gestión de Riesgos

Se identifican riesgos técnicos, operativos y de seguridad con estrategias de mitigación.

---

## 🚀 Estado del Proyecto

Actualmente en desarrollo bajo metodología ágil con backlog estructurado y tareas en ejecución.

---

## 📎 Repositorio

👉 Este repositorio contiene:
- Gestión del proyecto
- Documentación técnica
- Modelo de negocio
- Estrategia de seguridad

---

## 👥 Equipo

Proyecto desarrollado en el marco de la Tecnicatura Superior en Telecomunicaciones (ISPC).

---

## 📌 Conclusión

OmniSens representa una solución integral que combina IoT, automatización y analítica de datos para transformar la gestión ambiental en entornos modernos.
