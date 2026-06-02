import { beforeAll, afterAll } from 'vitest';
import { build } from './helper.js';

let app: any;

beforeAll(async () => {
  app = await build();
});

afterAll(async () => {
  await app.close();
});

export { app };
