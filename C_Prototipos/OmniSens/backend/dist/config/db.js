"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const kysely_1 = require("kysely");
// Configuración del dialecto de PostgreSQL usando el pool nativo de 'pg'
const dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'omnisens',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 10, // Maximo de conexiones en el pool. Optimizado para bajo consumo de RAM en la Netbook.
    })
});
// Instancia de Kysely ligera que reemplaza a un ORM pesado
exports.db = new kysely_1.Kysely({
    dialect,
});
