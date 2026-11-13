import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://disliyagi.com',
  integrations: [sitemap()],
});
