import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { validateEnv } from '../utils/env.js';

const env = validateEnv();

export default fp(async (fastify, _options) => {
  fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
}, {
  name: 'jwt-plugin',
});
