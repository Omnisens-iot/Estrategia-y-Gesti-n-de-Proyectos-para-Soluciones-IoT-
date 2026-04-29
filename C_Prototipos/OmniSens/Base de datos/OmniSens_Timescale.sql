-- Extensión para series temporales
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. Tabla de Clientes (Organizaciones)
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    business_tax_id VARCHAR(50), -- Opcional: para facturación
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ
);

-- 2. Tabla de Usuarios
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_role VARCHAR(20) DEFAULT 'viewer', -- 'admin', 'operator', 'viewer'
    full_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ
);

-- 3. Tabla de inventario de dispositivos (Actualizada para multi-tenant)
CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE SET NULL, -- Vínculo con el cliente
    mac_address MACADDR UNIQUE NOT NULL,
    device_name VARCHAR(100),
    hmac_secret VARCHAR(64) NOT NULL, -- Secreto único para autenticación dinámica
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_connection TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'inactive',
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ
);

-- 4. Tabla de telemetría (Hipertabla)
CREATE TABLE air_quality_data (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    pm25 FLOAT,   -- Material particulado 2.5
    pm10 FLOAT,   -- Material particulado 10
    co2 FLOAT,    -- Dióxido de carbono
    temp FLOAT,   -- Temperatura
    hum FLOAT,    -- Humedad
    CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES devices (device_id)
);

-- Convertir en hipertabla particionada por tiempo (7 días por partición para optimizar RAM)
SELECT create_hypertable('air_quality_data', 'time', chunk_time_interval => INTERVAL '7 days');

-- Índice para búsquedas rápidas por dispositivo y tiempo
CREATE INDEX idx_device_time ON air_quality_data (device_id, time DESC);

-- =========================================================================
-- VISTA (View) PARA CONSULTAS MULTI-TENANT
-- =========================================================================
-- Facilita al backend las consultas filtradas por cliente
CREATE OR REPLACE VIEW vw_telemetry_by_client AS
SELECT 
    aq.time,
    aq.device_id,
    d.device_name,
    d.client_id,
    c.client_name,
    aq.pm25,
    aq.pm10,
    aq.co2,
    aq.temp,
    aq.hum
FROM air_quality_data aq
JOIN devices d ON aq.device_id = d.device_id
JOIN clients c ON d.client_id = c.client_id;

-- =========================================================================
-- FUNCIÓN (Stored Procedure) PARA REGISTRAR DISPOSITIVOS
-- =========================================================================
-- Registra un nuevo dispositivo solo si la dirección MAC no existe previamente.
-- Ahora incluye el vínculo opcional con un cliente (client_id).
CREATE OR REPLACE FUNCTION register_new_device(
    p_device_id VARCHAR(50),
    p_mac_address MACADDR,
    p_hmac_secret VARCHAR(64),
    p_device_name VARCHAR(100) DEFAULT NULL,
    p_client_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO devices (device_id, mac_address, device_name, hmac_secret, client_id)
    VALUES (p_device_id, p_mac_address, p_device_name, p_hmac_secret, p_client_id)
    ON CONFLICT (mac_address) DO NOTHING;
    
    -- FOUND es una variable especial en PL/pgSQL que es verdadera si la última instrucción afectó alguna fila.
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- AGREGACIÓN CONTINUA (Continuous Aggregates)
-- =========================================================================
-- 1. Crear vista materializada que promedie los datos por hora
CREATE MATERIALIZED VIEW vw_air_quality_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket,
       device_id,
       AVG(pm25) AS avg_pm25,
       AVG(pm10) AS avg_pm10,
       AVG(co2) AS avg_co2,
       AVG(temp) AS avg_temp,
       AVG(hum) AS avg_hum
FROM air_quality_data
GROUP BY bucket, device_id;

-- 2. Configurar política de actualización automática para la agregación
SELECT add_continuous_aggregate_policy('vw_air_quality_hourly',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- =========================================================================
-- CICLO DE VIDA DE DATOS (Data Lifecycle / Retention Policies)
-- =========================================================================
-- 1. Borrar automáticamente los datos crudos (segundo a segundo) con más de 60 días
SELECT add_retention_policy('air_quality_data', INTERVAL '60 days');

-- 2. (Opcional) Borrar los promedios horarios después de 1 año (para evitar crecimiento infinito)
SELECT add_retention_policy('vw_air_quality_hourly', INTERVAL '1 year');
