import { FastifyRequest, FastifyReply } from 'fastify';
import { DeliveryZonesService } from './delivery-zones.service.js';
import logger from '../../utils/logger.js';

export class DeliveryZonesController {
  constructor(private deliveryZonesService: DeliveryZonesService) {}

  async getDeliveryZones(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const zones = await this.deliveryZonesService.getDeliveryZones();
      reply.send(zones);
    } catch (error) {
      logger.error({ msg: 'Error in get delivery zones controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getDeliveryZoneById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const zone = await this.deliveryZonesService.getDeliveryZoneById(id);
      reply.send(zone);
    } catch (error) {
      logger.error({ msg: 'Error in get delivery zone by id controller', error });
      if (error instanceof Error && error.message === 'Delivery zone not found') {
        reply.status(404).send({ error: 'Delivery zone not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}
