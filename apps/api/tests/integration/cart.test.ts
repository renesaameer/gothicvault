import { describe, it, expect } from 'vitest';
import { build } from '../helper.js';

describe('Cart Integration Tests', () => {
  it('should create a guest cart token', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart/token',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('cartToken');

    await app.close();
  });

  it('should get an empty cart', async () => {
    const app = await build();

    const response = await app.inject({
      method: 'GET',
      url: '/api/cart',
      headers: {
        'x-cart-token': 'test-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('items');
    expect(response.json()).toHaveProperty('totals');

    await app.close();
  });
});
