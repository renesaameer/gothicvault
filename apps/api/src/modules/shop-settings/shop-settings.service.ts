import prisma from '../../utils/prisma.js';
import logger from '../../utils/logger.js';

export class ShopSettingsService {
  async getShopSettings() {
    try {
      let settings = await prisma.shopSettings.findFirst();
      
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.shopSettings.create({
          data: {
            defaultSorting: 'newest',
            sortingEnabled: true,
            searchEnabled: true,
            cardCtaMode: 'add_to_cart',
            cardShowAddToCart: true,
            cardShowBuyNow: false,
            cardShowViewDetails: true,
            pdpShowShipmentDetails: true,
            pdpShowWhyChooseUs: true,
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error({ msg: 'Error getting shop settings', error });
      throw error;
    }
  }
}
