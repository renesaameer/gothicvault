import prisma from '../../utils/prisma.js';
import logger from '../../utils/logger.js';

export class DeliveryZonesService {
  async getDeliveryZones() {
    try {
      const zones = await prisma.deliveryZone.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
      return zones;
    } catch (error) {
      logger.error({ msg: 'Error getting delivery zones', error });
      throw error;
    }
  }

  async getDeliveryZoneById(id: string) {
    try {
      const zone = await prisma.deliveryZone.findUnique({
        where: { id },
      });

      if (!zone) {
        throw new Error('Delivery zone not found');
      }

      return zone;
    } catch (error) {
      logger.error({ msg: 'Error getting delivery zone by id', error });
      throw error;
    }
  }
}
