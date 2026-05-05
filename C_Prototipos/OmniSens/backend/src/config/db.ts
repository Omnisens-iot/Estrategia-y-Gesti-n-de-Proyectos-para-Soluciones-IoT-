import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

// Interfaz que mapea las tablas de la base de datos para Kysely (TypeScript)
export interface Database {
  air_quality_data: {
    time: Date;
    device_id: string;
    pm25: number;
    pm10: number;
    co2: number | null;
    temp: number | null;
    hum: number | null;
  };
  devices: {
    device_id: string;
    client_id: number | null;
    mac_address: string;
    device_name: string | null;
    hmac_secret: string;
    created_at: Date;
    last_connection: Date | null;
    status: string;
    is_active: boolean;
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
