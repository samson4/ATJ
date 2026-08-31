// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/content', '@pinia/nuxt', 'nuxt-studio', '@vercel/analytics', '@nuxtjs/sitemap'],
  site: {
    url: 'https://addistechjobs.work',
    name: 'Addis Tech Jobs'
  },
  sitemap: {
    urls: [
      '/',
      '/companies',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ],
    exclude: [
      '/auth/**',
      '/profile',
      '/security',
      '/saved-jobs',
      '/applications',
      '/company/**'
    ]
  },
  studio: {
    repository: {
      provider: 'github', // 'github' or 'gitlab'
      owner: 'samson4',
      repo: 'ATJ',
      branch: 'main'
    }
  },
 pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**'],
  },
  css: ['~/assets/css/main.css','@tailwindcss/typography'],
  plugins:["~/plugins/supabase.ts"],
  runtimeConfig: {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    public: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    FRONTEND_REDIRECT_URL:process.env.FRONTEND_REDIRECT_URL
    }
  },
})
