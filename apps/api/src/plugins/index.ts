import loggerPlugin from './logger.js';
import databasePlugin from './database.js';
import jwtPlugin from './jwt.js';
import corsPlugin from './cors.js';
import swaggerPlugin from './swagger.js';

export const plugins = [
  loggerPlugin,
  databasePlugin,
  jwtPlugin,
  corsPlugin,
  swaggerPlugin,
];
