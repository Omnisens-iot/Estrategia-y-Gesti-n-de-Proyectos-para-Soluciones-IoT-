# Archivo Legado (Legacy Archive)

Esta carpeta ha sido creada para almacenar componentes, prototipos y pruebas de concepto generados durante las fases tempranas del desarrollo de **OmniSens**. 

**Ninguno de estos directorios está en uso en el ecosistema de producción actual.**

## Contenido Histórico

*   `api (adaptada)/`: Versiones tempranas o prototipos de la API REST que fueron descartadas en favor de la arquitectura de microservicios con Fastify (`/backend`).
*   `Base de datos/`: Scripts SQL antiguos y archivos de MySQL Workbench. La base de datos actual utiliza TimescaleDB y su esquema está gobernado de otra forma.
*   `Edge/`: Documentación y notas antiguas relacionadas con el hardware Edge.
*   `hub/`: Pruebas de concepto para la interfaz visual y el backend que fueron reemplazadas por los proyectos Vue 3 y Fastify.
*   `Tests/`: Entorno de pruebas legacy.

> **Nota para Desarrolladores:** La rama y estructura principal en la raíz del repositorio constituye la versión **Production-Ready**. No utilices el código contenido aquí para nuevos desarrollos.
