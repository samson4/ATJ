import type { H3Event } from 'h3'
import { requireServerSupabase } from './serverSupabase'

export async function requireResumeUser(event: H3Event) {
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token' })
  }

  const supabase = requireServerSupabase(event)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token' })
  }

  return { supabase, user }
}
