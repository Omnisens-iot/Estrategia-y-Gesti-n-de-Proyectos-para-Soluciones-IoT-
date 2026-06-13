-- ==============================================================================
-- Esquema de Base de Datos e Inserciones Semilla (Seed Data) para OmniSens
-- Ubicación: configuraciones/init-db.sql
-- ==============================================================================

-- Extensión para series temporales
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. Clientes (Con Soft Delete)
CREATE TABLE IF NOT EXISTS clients (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    business_tax_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Usuarios (Con Soft Delete)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_role VARCHAR(20) DEFAULT 'viewer',
    full_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Dispositivos (Con Soft Delete)
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE SET NULL,
    mac_address MACADDR UNIQUE NOT NULL,
    device_name VARCHAR(100),
    hmac_secret VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_connection TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'inactive',
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 4. Hipertabla de Telemetría (Datos Crudos)
CREATE TABLE IF NOT EXISTS air_quality_data (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    pm25 FLOAT,
    pm10 FLOAT,
    co2 FLOAT,
    temp FLOAT,
    hum FLOAT,
    pres FLOAT,
    l INTEGER,
    lux FLOAT,
    battery FLOAT,
    r1 INTEGER,
    r2 INTEGER,
    pwm INTEGER,
    CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES devices (device_id)
);

-- Crear Hipertabla particionada por tiempo (Verifica si no se ha convertido ya)
SELECT create_hypertable('air_quality_data', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_device_time ON air_quality_data (device_id, time DESC);

-- 5. AGREGACIÓN CONTINUA: Promedios por Hora (Optimización extrema)
CREATE MATERIALIZED VIEW IF NOT EXISTS aqi_hourly_avg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket,
       device_id,
       AVG(pm25) as avg_pm25,
       AVG(pm10) as avg_pm10,
       AVG(co2) as avg_co2,
       AVG(temp) as avg_temp,
       AVG(hum) as avg_hum,
       AVG(pres) as avg_pres,
       AVG(l) as avg_l,
       AVG(lux) as avg_lux,
       AVG(battery) as avg_battery
FROM air_quality_data
GROUP BY bucket, device_id;

-- AGREGADO: Política para que la vista materializada se actualice sola automáticamente en segundo plano (Evita errores si ya existe)
SELECT add_continuous_aggregate_policy('aqi_hourly_avg',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- 6. RETENCIÓN DE DATOS: Borrar datos crudos después de 30 días automáticamente (Evita errores si ya existe)
SELECT add_retention_policy('air_quality_data', INTERVAL '30 days', if_not_exists => TRUE);

-- =========================================================================
-- VISTA PARA CONSULTAS MULTI-TENANT
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
    aq.hum,
    aq.pres,
    aq.l,
    aq.lux,
    aq.battery,
    aq.r1,
    aq.r2,
    aq.pwm
FROM air_quality_data aq
JOIN devices d ON aq.device_id = d.device_id
JOIN clients c ON d.client_id = c.client_id
WHERE d.deleted_at IS NULL AND c.deleted_at IS NULL;

-- =========================================================================
-- FUNCIÓN (Stored Procedure) PARA REGISTRAR DISPOSITIVOS
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

-- =========================================================================
-- INSERCIÓN DE DATOS SEMILLA (Para pruebas y simulaciones locales)
-- =========================================================================

-- Cliente Demo
INSERT INTO clients (client_id, client_name, business_tax_id)
VALUES (1, 'Cliente Demo Local', '30-11111111-9')
ON CONFLICT (client_id) DO UPDATE 
SET client_name = EXCLUDED.client_name;

-- Usuario de prueba (email: admin@omnisens.com)
INSERT INTO users (user_id, client_id, email, password_hash, user_role, full_name)
VALUES (1, 1, 'admin@omnisens.com', 'scrypt$mock_password_hash', 'admin', 'Administrador Local')
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email;

-- Dispositivos Semilla asociados al Cliente 1
INSERT INTO devices (device_id, client_id, mac_address, device_name, hmac_secret, status)
VALUES 
  ('AQC_001', 1, 'c8:f0:9e:01:02:03', 'Nodo Central Oficina', 'super_secret_hmac_key_for_testing', 'active'),
  ('AQC_002', 1, 'c8:f0:9e:04:05:06', 'Nodo Exterior Patio', 'another_secret_hmac_key_for_testing', 'active')
ON CONFLICT (device_id) DO UPDATE 
SET device_name = EXCLUDED.device_name, client_id = EXCLUDED.client_id, mac_address = EXCLUDED.mac_address;

-- Telemetría de Prueba Inicial
INSERT INTO air_quality_data (time, device_id, pm25, pm10, co2, temp, hum, pres, l, lux, battery, r1, r2, pwm)
VALUES 
  (NOW() - INTERVAL '10 minutes', 'AQC_001', 12.4, 25.1, 410, 24.5, 45.2, 1013.25, 2048, 350.0, 3.82, 0, 0, 0),
  (NOW() - INTERVAL '5 minutes', 'AQC_001', 13.1, 26.0, 415, 24.6, 45.0, 1013.30, 2100, 355.0, 3.81, 0, 0, 0),
  (NOW() - INTERVAL '10 minutes', 'AQC_002', 28.5, 52.3, 390, 18.2, 62.1, 1009.10, 500, 40.0, 3.75, 1, 0, 128),
  (NOW() - INTERVAL '5 minutes', 'AQC_002', 29.0, 53.0, 395, 18.0, 62.5, 1009.15, 520, 42.0, 3.74, 1, 0, 130);
