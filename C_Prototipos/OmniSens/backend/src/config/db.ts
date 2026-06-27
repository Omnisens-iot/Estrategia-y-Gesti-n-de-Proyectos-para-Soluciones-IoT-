import { Pool } from 'pg';
import { Kysely, PostgresDialect, Generated } from 'kysely';

// Interfaz que mapea las tablas de la base de datos para Kysely (TypeScript)
export interface Database {
  clients: {
    client_id: Generated<number>;
    client_name: string;
    business_tax_id: string | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    deleted_at: Date | null;
  };
  users: {
    user_id: Generated<number>;
    client_id: number;
    email: string;
    password_hash: string;
    user_role: string;
    full_name: string | null;
    created_at: Generated<Date>;
    deleted_at: Date | null;
  };
  air_quality_data: {
    time: Date;
    device_id: string;
    pm25: number;
    pm10: number;
    co2: number | null;
    temp: number | null;
    hum: number | null;
    pres: number | null;
    l: number | null;
    lux: number | null;
    battery: number | null;
    r1: number | null;
    r2: number | null;
    pwm: number | null;
  };
  device_rules: {
    rule_id: Generated<number>;
    device_id: string;
    metric: string;
    threshold: number;
    hysteresis: number;
    action: string;
    priority: number;
    created_at: Generated<Date>;
  };
  devices: {
    device_id: string;
    client_id: number | null;
    mac_address: string;
    device_name: string | null;
    hmac_secret: string;
    created_at: Generated<Date>;
    last_connection: Date | null;
    status: string;
    is_active: Generated<boolean>;
    deleted_at: Date | null;
  };
  aqi_hourly_avg: {
    bucket: Date;
    device_id: string;
    avg_pm25: number;
    avg_pm10: number;
    avg_co2: number;
    avg_temp: number;
    avg_hum: number;
    avg_pres: number;
    avg_l: number;
    avg_lux: number;
    avg_battery: number;
  };
  vw_telemetry_by_client: {
    time: Date;
    device_id: string;
    device_name: string | null;
    client_id: number;
    client_name: string;
    pm25: number;
    pm10: number;
    co2: number | null;
    temp: number | null;
    hum: number | null;
    pres: number | null;
    l: number | null;
    lux: number | null;
    battery: number | null;
    r1: number | null;
    r2: number | null;
    pwm: number | null;
  };
}

// Configuración del dialecto de PostgreSQL usando el pool nativo de 'pg'
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'omnisens',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10, // Maximo de conexiones en el pool. Optimizado para bajo consumo de RAM en la Netbook.
  })
});

// Instancia de Kysely ligera que reemplaza a un ORM pesado
export const db = new Kysely<Database>({
  dialect,
});
