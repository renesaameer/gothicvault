import { describe, it, expect } from 'vitest';
import { build } from '../helper.js';

describe('Auth Integration Tests', () => {
  it('should register a new user', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'Test123456',
        name: 'Test User',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('user');
    expect(response.json()).toHaveProperty('accessToken');

    await app.close();
  });

  it('should login with valid credentials', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'Test123456',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('accessToken');
    expect(response.json()).toHaveProperty('refreshToken');

    await app.close();
  });

  it('should fail login with invalid credentials', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'WrongPassword',
      },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});
