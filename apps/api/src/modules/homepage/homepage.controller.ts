import { FastifyRequest, FastifyReply } from 'fastify';
import { HomepageService } from './homepage.service.js';
import { updateHomepageSettingsSchema, type UpdateHomepageSettingsDto } from './dto/index.js';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';

export class HomepageController {
  constructor(private homepageService: HomepageService) {}

  async getHomepageSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await this.homepageService.getHomepageSettings();
      reply.send(settings);
    } catch (error) {
      logger.error({ msg: 'Error in get homepage settings controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateHomepageSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = updateHomepageSettingsSchema.parse(request.body) as UpdateHomepageSettingsDto;
      const settings = await this.homepageService.updateHomepageSettings(data);
      reply.send(settings);
    } catch (error) {
      logger.error({ msg: 'Error in update homepage settings controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async resetHomepageSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await this.homepageService.resetHomepageSettings();
      reply.send(settings);
    } catch (error) {
      logger.error({ msg: 'Error in reset homepage settings controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHeroSlides(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const slides = await this.homepageService.getHeroSlides();
      reply.send(slides);
    } catch (error) {
      logger.error({ msg: 'Error in get hero slides controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHomepageSections(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const sections = await this.homepageService.getHomepageSections();
      reply.send(sections);
    } catch (error) {
      logger.error({ msg: 'Error in get homepage sections controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTestimonials(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const testimonials = await this.homepageService.getTestimonials();
      reply.send(testimonials);
    } catch (error) {
      logger.error({ msg: 'Error in get testimonials controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHomeFaqs(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const faqs = await this.homepageService.getHomeFaqs();
      reply.send(faqs);
    } catch (error) {
      logger.error({ msg: 'Error in get home FAQs controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getWhyChooseUsCards(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const cards = await this.homepageService.getWhyChooseUsCards();
      reply.send(cards);
    } catch (error) {
      logger.error({ msg: 'Error in get why choose us cards controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getVideoTestimonials(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const testimonials = await this.homepageService.getVideoTestimonials();
      reply.send(testimonials);
    } catch (error) {
      logger.error({ msg: 'Error in get video testimonials controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getFeaturedCategories(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.homepageService.getFeaturedCategories();
      reply.send(categories);
    } catch (error) {
      logger.error({ msg: 'Error in get featured categories controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
}
