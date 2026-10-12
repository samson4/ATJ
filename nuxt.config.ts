// https://nuxt.com/docs/api/configuration/nuxt-config
const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
let appBaseHost: string | undefined
try {
  appBaseHost = new URL(appBaseUrl).hostname
} catch {
  appBaseHost = undefined
}

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
      '/resume-builder',
      '/privacy',
      '/terms'
    ],
    exclude: [
      '/auth/**',
      '/profile',
      '/security',
      '/saved-jobs',
      '/applications',
      '/resumes/**',
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
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY,
    CHAPA_WEBHOOK_SECRET: process.env.CHAPA_WEBHOOK_SECRET,
    chapaMode: process.env.CHAPA_MODE || 'test',
    appBaseUrl,
    resumeBillingEnabled: process.env.RESUME_BILLING_ENABLED || 'false',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
      FRONTEND_REDIRECT_URL: process.env.FRONTEND_REDIRECT_URL,
      CONTACT_EMAIL: process.env.NUXT_PUBLIC_CONTACT_EMAIL
    }
  },
  nitro: {
    prerender: {
      routes: ['/']
    },
    serverAssets: [{
      baseName: 'resume-fonts',
      dir: './assets/resume-fonts'
    }]
  },
  vite: {
    server: {
      allowedHosts: appBaseHost ? [appBaseHost] : []
    },
    optimizeDeps: {
      include: ['@vueuse/integrations/useSortable'],
      exclude: ['@vueuse/core']
    }
  }
})
