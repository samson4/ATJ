import type { SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

declare module 'h3' {
  interface H3EventContext {
    supabaseAdmin?: SupabaseClient
  }
}

export function requireServerSupabase(event: H3Event) {
  const supabase = event.context.supabaseAdmin
  if (!supabase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server configuration is missing'
    })
  }
  return supabase
}
