-- Extensión para series temporales
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. Clientes (Con Soft Delete)
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    business_tax_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Soft Delete
);

-- 2. Usuarios (Con Soft Delete)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_role VARCHAR(20) DEFAULT 'viewer',
    full_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Soft Delete
);

-- 3. Dispositivos (Con Soft Delete)
CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE SET NULL,
    mac_address MACADDR UNIQUE NOT NULL,
    device_name VARCHAR(100),
    hmac_secret VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_connection TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'inactive',
    deleted_at TIMESTAMPTZ DEFAULT NULL -- Soft Delete
);

-- 4. Hipertabla de Telemetría (Datos Crudos)
CREATE TABLE air_quality_data (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    pm25 FLOAT,
    pm10 FLOAT, -- REAGREGADO: Fundamental para el cálculo de AQI junto con pm25
    co2 FLOAT,
    temp FLOAT,
    hum FLOAT,
    CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES devices (device_id) -- REAGREGADO: Integridad referencial
);

-- Crear Hipertabla particionada por tiempo
SELECT create_hypertable('air_quality_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX idx_device_time ON air_quality_data (device_id, time DESC);

-- 5. AGREGACIÓN CONTINUA: Promedios por Hora (Optimización extrema)
CREATE MATERIALIZED VIEW aqi_hourly_avg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket,
       device_id,
       AVG(pm25) as avg_pm25,
       AVG(pm10) as avg_pm10, -- REAGREGADO: Promedio para pm10
       AVG(co2) as avg_co2,
       AVG(temp) as avg_temp,
       AVG(hum) as avg_hum
FROM air_quality_data
GROUP BY bucket, device_id;

-- AGREGADO: Política para que la vista materializada se actualice sola automáticamente en segundo plano
SELECT add_continuous_aggregate_policy('aqi_hourly_avg',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- 6. RETENCIÓN DE DATOS: Borrar datos crudos después de 30 días automáticamente
SELECT add_retention_policy('air_quality_data', INTERVAL '30 days');
-- Nota: Los promedios calculados en 'aqi_hourly_avg' NO se borran, quedan para el histórico.

-- =========================================================================
-- VISTA PARA CONSULTAS MULTI-TENANT (Mantenido de la versión anterior)
-- =========================================================================
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
JOIN clients c ON d.client_id = c.client_id
WHERE d.deleted_at IS NULL AND c.deleted_at IS NULL; -- AGREGADO: Se filtran entidades con soft delete

-- =========================================================================
-- FUNCIÓN (Stored Procedure) PARA REGISTRAR DISPOSITIVOS (Mantenido)
-- =========================================================================
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
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
