# 📚 Documentación Técnica de OmniSens

Este directorio contiene la documentación técnica profunda sobre la arquitectura, base de datos, seguridad, despliegue y firmware de la plataforma IoT OmniSens.

## 🗂️ Índice de Documentación

A continuación se describen los documentos disponibles en este directorio:

| Documento | Descripción |
| :--- | :--- |
| [🏗️ Arquitectura y Funcionalidades](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/arquitectura_y_funcionalidades.md) | **Documento Principal.** Detalla la arquitectura global del sistema (Edge-to-Cloud), capa de transporte MQTT, persistencia, seguridad multitenant y un análisis exhaustivo del frontend con propuestas de refactorización. |
| [📟 Arquitectura del Firmware](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Firmware_Architecture.md) | Detalla la estructura del firmware C++ (PlatformIO) ejecutado en el ESP32, incluyendo multitarea con FreeRTOS, Watchdog (TWDT) y aprovisionamiento Zero-Touch. |
| [💾 Diccionario de Base de Datos](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Diccionario_Base_de_Datos.md) | Describe el esquema relacional de PostgreSQL, el uso de hipertablas de TimescaleDB, vistas multitenant, continuous aggregates (promedios horarios) y stored procedures. |
| [🔑 Estrategia JWT Multi-Tenant](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Estrategia_JWT_MultiTenant.md) | Detalla el diseño del payload del JWT y el flujo de aislamiento de datos en las consultas REST del Backend. |
| [💻 Guía de Despliegue Local](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Guia_Despliegue_Local.md) | Manual de instrucciones para levantar el entorno de desarrollo local con Docker Desktop y probar la ingesta mediante clientes MQTT (MQTTX). |
| [🔒 Generar Certificados TLS](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Generar_Certificados_TLS.md) | Guía técnica para la generación de certificados SSL/TLS autofirmados para el cifrado de comunicaciones en el Broker EMQX (MQTTS). |
| [🧾 Presupuesto y Componentes](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/Listado_Componentes_y_Recursos_Presupuesto.md) | Listado y presupuesto detallado de los sensores, actuadores y microcontroladores utilizados para la construcción de los nodos físicos. |

---

## 🛠️ Próximos Pasos en el Frontend

Para realizar los ajustes en el frontend referenciados en el documento de [Arquitectura y Funcionalidades](file:///c:/Users/Fernando/Desktop/Desktop/tecnicaturas/telecomunicaciones/AA_New_folder/Estrategia-y-Gesti-n-de-Proyectos-para-Soluciones-IoT-/C_Prototipos/OmniSens/docs/arquitectura_y_funcionalidades.md#6-diagnóstico-y-plan-de-refactorización-del-frontend):
1. Levantar el stack local de Docker Compose (`docker compose up --build -d`).
2. Acceder al directorio `/frontend` y ejecutar `npm install` para asegurar que las dependencias están al día.
3. Descomentar progresivamente las llamadas de la API Axios (`api.ts`) en las vistas correspondientes (`DashboardView.vue`, `DeviceManagerView.vue`, `AnalyticsView.vue`, `RulesEngineView.vue`).
4. Reemplazar los datos estáticos (*mock*) por las respuestas dinámicas devueltas por los endpoints de la API.
