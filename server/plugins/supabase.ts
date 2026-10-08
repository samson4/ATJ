import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.SUPABASE_URL
  const supabaseSecretKey = config.SUPABASE_SECRET_KEY

  // Keep startup and static generation available without server credentials.
  // Protected API routes return a configuration error when they are called.
  if (!supabaseUrl || !supabaseSecretKey) return

  const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })

  nitroApp.hooks.hook('request', (event) => {
    event.context.supabaseAdmin = supabaseAdmin
  })
})
