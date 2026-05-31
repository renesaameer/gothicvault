export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Serve static assets from ./dist; SPA fallback is configured in wrangler.toml
    return env.ASSETS.fetch(request);
  },
};
