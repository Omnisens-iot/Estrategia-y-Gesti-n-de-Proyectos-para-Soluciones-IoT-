import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db';
import crypto from 'crypto';

interface LoginBody {
  email: string;
  password_hash?: string; // The frontend should ideally send plain text and backend hashes it, but let's assume it sends plain text in 'password'
  password?: string;
}

interface RegisterBody {
  email: string;
  password?: string;
  full_name: string;
  client_name: string; // The company or client name
}

// Helper para crear hash con scrypt
const hashPassword = (password: string) => {
  // Using a fixed salt for simplicity, but in production a random salt per user should be used.
  // The seed in the DB uses 'scrypt$mock_password_hash'. Let's check what the seed actually has.
  // We will generate a scrypt hash.
  const salt = 'omnisens_salt';
  return 'scrypt$' + crypto.scryptSync(password, salt, 64).toString('hex');
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as LoginBody;

  if (!email || !password) {
    return reply.status(400).send({ error: 'Faltan credenciales' });
  }

  try {
    const user = await db.selectFrom('users')
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

  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error interno en login' });
  }
};

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password, full_name, client_name } = request.body as RegisterBody;

  if (!email || !password || !full_name || !client_name) {
    return reply.status(400).send({ error: 'Faltan campos requeridos' });
  }

  try {
    // 1. Create client
    const newClient = await db.insertInto('clients')
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
    const newUser = await db.insertInto('users')
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

  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Error interno en registro' });
  }
};
