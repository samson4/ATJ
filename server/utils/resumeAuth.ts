import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export async function requireResumeUser(event: H3Event) {
  const config = useRuntimeConfig()
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token' })
  }

  if (!config.public.SUPABASE_URL || !config.SUPABASE_SECRET_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase server configuration is missing' })
  }

  const supabase = createClient(config.public.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token' })
  }

  return { supabase, user }
}
