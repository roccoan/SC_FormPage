import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    lastReviewed: z.coerce.date().optional(),
    author: z.string().default('Screening Clearing Editorial'),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    type: z.enum(['feature', 'screening', 'science']),
    slug: z.string().optional(),
    readingTime: z.string().optional(),
    disclaimer: z.boolean().default(false),
    speakable: z.boolean().default(false),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { blog };
