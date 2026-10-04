import { defineCollection, defineContentConfig, property } from "@nuxt/content";
import { z } from "zod";
export default defineContentConfig({
  collections: {
    'index': defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        links: z.array(z.object({
          label: z.string(),
          to: z.string(),
          icon: z.string().optional()
        })).optional()
      })
    })
  }

})



