import { FastifyInstance } from 'fastify';
import { DeliveryZonesService } from './delivery-zones.service.js';
import { DeliveryZonesController } from './delivery-zones.controller.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function deliveryZonesRoutes(fastify: FastifyInstance) {
  const deliveryZonesService = new DeliveryZonesService();
  const deliveryZonesController = new DeliveryZonesController(deliveryZonesService);

  // Get all delivery zones (public)
  fastify.get('/delivery-zones', {
    preHandler: [generalRateLimit()],
    handler: deliveryZonesController.getDeliveryZones.bind(deliveryZonesController),
  });

  // Get delivery zone by ID (public)
  fastify.get('/delivery-zones/:id', {
    preHandler: [generalRateLimit()],
    handler: deliveryZonesController.getDeliveryZoneById.bind(deliveryZonesController),
  });
}
