import { FastifyRequest, FastifyReply } from 'fastify';
import { ShopSettingsService } from './shop-settings.service.js';
import logger from '../../utils/logger.js';

export class ShopSettingsController {
  constructor(private shopSettingsService: ShopSettingsService) {}

  async getShopSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await this.shopSettingsService.getShopSettings();
      reply.send(settings);
    } catch (error) {
      logger.error({ msg: 'Error in get shop settings controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
}
