import prisma from '../../utils/prisma.js';
import type { UpdateHomepageSettingsDto } from './dto/index.js';
import logger from '../../utils/logger.js';

export class HomepageService {
  async getHomepageSettings() {
    try {
      let settings = await prisma.homepageSection.findFirst();
      
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.homepageSection.create({
          data: {
            content: {
              heroTitle: 'Welcome to Our Store',
              heroSubtitle: 'Discover amazing products',
              showNewsletter: true,
            },
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error({ msg: 'Error getting homepage settings', error });
      throw error;
    }
  }

  async updateHomepageSettings(data: UpdateHomepageSettingsDto) {
    try {
      let settings = await prisma.homepageSection.findFirst();
      
      if (!settings) {
        settings = await prisma.homepageSection.create({
          data: {
            content: data as any,
          },
        });
      } else {
        settings = await prisma.homepageSection.update({
          where: { id: settings.id },
          data: {
            content: data as any,
          },
        });
      }

      logger.info('Homepage settings updated');
      return settings;
    } catch (error) {
      logger.error({ msg: 'Error updating homepage settings', error });
      throw error;
    }
  }

  async resetHomepageSettings() {
    try {
      const settings = await prisma.homepageSection.findFirst();
      
      if (settings) {
        await prisma.homepageSection.update({
          where: { id: settings.id },
          data: {
            content: {
              heroTitle: 'Welcome to Our Store',
              heroSubtitle: 'Discover amazing products',
              heroImageUrl: null,
              heroCtaText: null,
              heroCtaLink: null,
              featuredProductIds: [],
              bannerImageUrl: null,
              bannerTitle: null,
              bannerLink: null,
              showNewsletter: true,
              newsletterTitle: null,
              newsletterDescription: null,
            },
          },
        });
      }

      logger.info('Homepage settings reset to defaults');
      return this.getHomepageSettings();
    } catch (error) {
      logger.error({ msg: 'Error resetting homepage settings', error });
      throw error;
    }
  }

  async getHeroSlides() {
    try {
      const slides = await prisma.heroSlide.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
      return slides;
    } catch (error) {
      logger.error({ msg: 'Error getting hero slides', error });
      throw error;
    }
  }

  async getHomepageSections() {
    try {
      const sections = await prisma.homepageSection.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
      return sections;
    } catch (error) {
      logger.error({ msg: 'Error getting homepage sections', error });
      throw error;
    }
  }

  async getTestimonials() {
    try {
      const testimonials = await prisma.testimonial.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return testimonials;
    } catch (error) {
      logger.error({ msg: 'Error getting testimonials', error });
      throw error;
    }
  }

  async getHomeFaqs() {
    try {
      const faqs = await prisma.homeFaq.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return faqs;
    } catch (error) {
      logger.error({ msg: 'Error getting home FAQs', error });
      throw error;
    }
  }

  async getWhyChooseUsCards() {
    try {
      const cards = await prisma.whyChooseUsCard.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return cards;
    } catch (error) {
      logger.error({ msg: 'Error getting why choose us cards', error });
      throw error;
    }
  }

  async getVideoTestimonials() {
    try {
      const testimonials = await prisma.videoTestimonial.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
      return testimonials;
    } catch (error) {
      logger.error({ msg: 'Error getting video testimonials', error });
      throw error;
    }
  }

  async getFeaturedCategories() {
    try {
      const categories = await prisma.featuredCategory.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
      return categories;
    } catch (error) {
      logger.error({ msg: 'Error getting featured categories', error });
      throw error;
    }
  }
}
