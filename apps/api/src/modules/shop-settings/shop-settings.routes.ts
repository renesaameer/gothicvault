import { FastifyInstance } from 'fastify';
import { ShopSettingsService } from './shop-settings.service.js';
import { ShopSettingsController } from './shop-settings.controller.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function shopSettingsRoutes(fastify: FastifyInstance) {
  const shopSettingsService = new ShopSettingsService();
  const shopSettingsController = new ShopSettingsController(shopSettingsService);

  // Get shop settings (public)
  fastify.get('/shop-settings', {
    preHandler: [generalRateLimit()],
    handler: shopSettingsController.getShopSettings.bind(shopSettingsController),
  });
}
