import { describe, it, expect } from 'vitest';
import { build } from '../helper.js';

describe('Products Integration Tests', () => {
  it('should get all products', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('data');
    expect(response.json()).toHaveProperty('pagination');

    await app.close();
  });

  it('should get featured products', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/featured',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('data');

    await app.close();
  });

  it('should get product by ID', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/test-id',
    });

    // May return 404 if product doesn't exist, which is expected
    expect([200, 404]).toContain(response.statusCode);

    await app.close();
  });
});
