# Diccionario y Arquitectura de la Base de Datos (OmniSens)

Este documento detalla la estructura y características "Enterprise" de la base de datos PostgreSQL + TimescaleDB del proyecto OmniSens, optimizada para arquitectura Multi-Tenant, alta concurrencia y bajo consumo de recursos (ideal para servidores Edge o de recursos limitados como un Intel Atom).

## 1. Características Principales

- **Motor:** PostgreSQL con extensión TimescaleDB.
- **Multi-Tenant:** Aislamiento de datos por cliente (Organización).
- **Soft Deletes:** Borrado lógico implementado en las tablas principales para mantener integridad histórica y permitir auditorías reales.
- **Series Temporales Optimizadas:** Uso de Hipertablas para la ingesta masiva rápida y particionamiento automático en RAM.
- **Data Lifecycle (Ciclo de Vida):** Políticas de retención automáticas para evitar que el almacenamiento crezca indefinidamente.
- **Continuous Aggregates:** Vistas materializadas que se actualizan solas en segundo plano para servir consultas de gráficos de manera instantánea, sin colapsar la CPU al momento de la consulta.

## 2. Esquema Relacional (Tablas)

### 2.1 Tabla: `clients`
Almacena la información de las organizaciones/clientes (los "inquilinos" de la plataforma).

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `client_id` | SERIAL (PK) | Identificador único del cliente. |
| `client_name` | VARCHAR(100) | Nombre comercial de la organización. |
| `business_tax_id` | VARCHAR(50) | CUIT/RUT o identificador fiscal (opcional). |
| `created_at` | TIMESTAMPTZ | Fecha de registro. |
| `updated_at` | TIMESTAMPTZ | Fecha de última modificación. |
| `deleted_at` | TIMESTAMPTZ | Fecha de borrado lógico (Soft Delete). |

### 2.2 Tabla: `users`
Almacena los usuarios que tendrán acceso al Dashboard, vinculados a un cliente.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `user_id` | SERIAL (PK) | Identificador único del usuario. |
| `client_id` | INTEGER (FK) | Vinculación con la tabla `clients` (`ON DELETE CASCADE`). |
| `email` | VARCHAR(150) | Correo electrónico (único, usado para el login). |
| `password_hash` | TEXT | Contraseña encriptada (bcrypt/argon2). |
| `user_role` | VARCHAR(20) | Rol del usuario (`admin`, `operator`, `viewer`). |
| `full_name` | VARCHAR(100) | Nombre completo. |
| `created_at` | TIMESTAMPTZ | Fecha de creación del usuario. |
| `deleted_at` | TIMESTAMPTZ | Fecha de borrado lógico (Soft Delete). |

### 2.3 Tabla: `devices`
Inventario de nodos sensores Edge (ESP32), vinculados a clientes para el multi-tenancy y con soporte de autenticación dinámica.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `device_id` | VARCHAR(50) (PK) | Identificador lógico/alfanumérico del dispositivo. |
| `client_id` | INTEGER (FK) | Vinculación con `clients` (`ON DELETE SET NULL`). |
| `mac_address` | MACADDR | Dirección física (única), usada para el aprovisionamiento. |
| `device_name` | VARCHAR(100) | Nombre descriptivo asignado por el usuario. |
| `hmac_secret` | VARCHAR(64) | Secreto único autogenerado para firmar conexiones MQTT. |
| `created_at` | TIMESTAMPTZ | Fecha en que se registró el dispositivo. |
| `last_connection`| TIMESTAMPTZ | Última vez que el dispositivo reportó telemetría o status. |
| `status` | VARCHAR(20) | Estado actual (`active`, `inactive`, `error`). |
| `deleted_at` | TIMESTAMPTZ | Fecha de borrado lógico (Soft Delete). |

### 2.4 Tabla: `air_quality_data` (Hipertabla TimescaleDB)
Almacena las mediciones crudas segundo a segundo (o minuto a minuto). Está convertida en Hipertabla particionada por intervalos de 1 día para optimizar la RAM en inserciones masivas.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `time` | TIMESTAMPTZ | Marca de tiempo exacta de la medición. |
| `device_id` | VARCHAR(50) (FK) | ID del dispositivo que generó el dato. |
| `pm25` | FLOAT | Concentración de Material Particulado 2.5 (µg/m³). |
| `pm10` | FLOAT | Concentración de Material Particulado 10 (µg/m³). |
| `co2` | FLOAT | Concentración de Dióxido de Carbono (ppm). |
| `temp` | FLOAT | Temperatura ambiente (°C). |
| `hum` | FLOAT | Humedad relativa (%). |

> **Nota de Optimización (Data Lifecycle)**: Cuenta con una **Política de Retención** que elimina los datos de esta tabla automáticamente cuando superan los **30 días** de antigüedad, evitando que el disco se llene por el volumen masivo de datos crudos.

## 3. Vistas y Funciones Especiales

### 3.1 Vista: `vw_telemetry_by_client`
Vista convencional relacional que facilita al backend (Hito 2) consultar datos filtrando por cliente sin tener que escribir JOINs complejos en el código. Excluye automáticamente a los clientes o dispositivos que hayan sufrido un "Soft Delete" (gracias a la condición `deleted_at IS NULL`).

### 3.2 Vista Materializada: `aqi_hourly_avg` (Continuous Aggregate)
Calcula y almacena promedios horarios de la telemetría de forma silenciosa en segundo plano. Es la fuente de datos principal para las gráficas históricas del Frontend (Hito 4).
- **Intervalo de Cálculo**: Agrupa datos cada `1 hour`.
- **Actualización**: Automática a través de una política de TimescaleDB programada cada hora.
- **Ventaja de Rendimiento**: Consultar 1 año de datos a través de esta tabla devuelve un máximo de ~8,760 filas en lugar de los millones de filas crudas, resultando en respuestas de la API en pocos milisegundos.
- **Retención Histórica**: Los datos precalculados en esta vista **no se borran tras 30 días**, conformando el repositorio histórico a largo plazo del sistema.

### 3.3 Stored Procedure: `register_new_device()`
Función interna (PL/pgSQL) utilizada para el aprovisionamiento eficiente de dispositivos. Se encarga de verificar si la dirección MAC ya existe usando la cláusula `ON CONFLICT DO NOTHING`, retornando un booleano al backend para notificar el éxito o fracaso de la inserción, ahorrando consultas extra (`SELECT` antes del `INSERT`).
