// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://screeningclearing.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/get-app'),
      serialize(item) {
        const url = item.url;
        if (url === 'https://screeningclearing.com/') return { ...item, changefreq: 'weekly', priority: 1.0 };
        if (url.includes('/am-i-due'))                return { ...item, changefreq: 'weekly', priority: 0.9 };
        if (url.includes('/blog/') && !url.endsWith('/blog/')) return { ...item, changefreq: 'monthly', priority: 0.8 };
        if (url.includes('/blog'))                    return { ...item, changefreq: 'weekly', priority: 0.7 };
        if (url.includes('/privacy') || url.includes('/cookies')) return { ...item, changefreq: 'yearly', priority: 0.2 };
        return { ...item, changefreq: 'monthly', priority: 0.5 };
      },
    }),
  ],
});