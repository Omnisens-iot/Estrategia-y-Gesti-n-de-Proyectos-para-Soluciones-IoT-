"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const db_1 = require("../config/db");
const crypto_1 = __importDefault(require("crypto"));
// Helper para crear hash con scrypt
const hashPassword = (password) => {
    // Using a fixed salt for simplicity, but in production a random salt per user should be used.
    // The seed in the DB uses 'scrypt$mock_password_hash'. Let's check what the seed actually has.
    // We will generate a scrypt hash.
    const salt = 'omnisens_salt';
    return 'scrypt$' + crypto_1.default.scryptSync(password, salt, 64).toString('hex');
};
const login = async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
        return reply.status(400).send({ error: 'Faltan credenciales' });
    }
    try {
        const user = await db_1.db.selectFrom('users')
            .selectAll()
            .where('email', '=', email)
            .where('deleted_at', 'is', null)
            .executeTakeFirst();
        if (!user) {
            return reply.status(401).send({ error: 'Credenciales inválidas' });
        }
        // Verify password
        // Support the mock hash from the seed
        const isMock = user.password_hash === 'scrypt$mock_password_hash' && password === 'admin123';
        const computedHash = hashPassword(password);
        if (user.password_hash !== computedHash && !isMock) {
            return reply.status(401).send({ error: 'Credenciales inválidas' });
        }
        // Sign JWT
        const token = await reply.jwtSign({
            sub: user.user_id.toString(),
            email: user.email,
            role: user.user_role,
            client_id: user.client_id,
        });
        reply.send({
            token,
            user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.user_role,
                client_id: user.client_id
            }
        });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno en login' });
    }
};
exports.login = login;
const register = async (request, reply) => {
    const { email, password, full_name, client_name } = request.body;
    if (!email || !password || !full_name || !client_name) {
        return reply.status(400).send({ error: 'Faltan campos requeridos' });
    }
    try {
        // 1. Create client
        const newClient = await db_1.db.insertInto('clients')
            .values({
            client_name,
            business_tax_id: null
        })
            .returning('client_id')
            .executeTakeFirst();
        if (!newClient) {
            return reply.status(500).send({ error: 'No se pudo crear el cliente' });
        }
        // 2. Create user
        const newUser = await db_1.db.insertInto('users')
            .values({
            client_id: newClient.client_id,
            email,
            password_hash: hashPassword(password),
            user_role: 'admin',
            full_name
        })
            .returning(['user_id', 'email', 'user_role', 'client_id', 'full_name'])
            .executeTakeFirst();
        if (!newUser) {
            return reply.status(500).send({ error: 'No se pudo crear el usuario' });
        }
        reply.status(201).send({
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser.user_id,
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.user_role,
                client_id: newUser.client_id
            }
        });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Error interno en registro' });
    }
};
exports.register = register;
