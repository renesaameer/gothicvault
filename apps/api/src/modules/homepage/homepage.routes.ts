import { FastifyInstance } from 'fastify';
import { HomepageService } from './homepage.service.js';
import { HomepageController } from './homepage.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function homepageRoutes(fastify: FastifyInstance) {
  const homepageService = new HomepageService();
  const homepageController = new HomepageController(homepageService);

  // Get homepage settings (public)
  fastify.get('/homepage/settings', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getHomepageSettings.bind(homepageController),
  });

  // Update homepage settings (admin/staff only)
  fastify.put('/homepage/settings', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: homepageController.updateHomepageSettings.bind(homepageController),
  });

  // Reset homepage settings to defaults (admin/staff only)
  fastify.post('/homepage/settings/reset', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: homepageController.resetHomepageSettings.bind(homepageController),
  });

  // Get hero slides (public)
  fastify.get('/homepage/hero-slides', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getHeroSlides.bind(homepageController),
  });

  // Get homepage sections (public)
  fastify.get('/homepage/sections', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getHomepageSections.bind(homepageController),
  });

  // Get testimonials (public)
  fastify.get('/homepage/testimonials', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getTestimonials.bind(homepageController),
  });

  // Get home FAQs (public)
  fastify.get('/homepage/faqs', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getHomeFaqs.bind(homepageController),
  });

  // Get why choose us cards (public)
  fastify.get('/homepage/why-choose-us', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getWhyChooseUsCards.bind(homepageController),
  });

  // Get video testimonials (public)
  fastify.get('/homepage/video-testimonials', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getVideoTestimonials.bind(homepageController),
  });

  // Get featured categories (public)
  fastify.get('/homepage/featured-categories', {
    preHandler: [generalRateLimit()],
    handler: homepageController.getFeaturedCategories.bind(homepageController),
  });
}
