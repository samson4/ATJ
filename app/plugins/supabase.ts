import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin((nuxtApp) => {
  const envConfig = useRuntimeConfig();
  const supabase = createClient(envConfig.public.SUPABASE_URL, envConfig.public.SUPABASE_PUBLISHABLE_KEY)
  nuxtApp.provide("supabase",supabase)
});