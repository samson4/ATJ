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

export function hasResumeBuilderBetaAccess(email: string | undefined, allowlist: unknown) {
  if (!email) return false

  const normalizedEmail = email.trim().toLowerCase()
  return String(allowlist || '')
    .split(',')
    .some(allowedEmail => allowedEmail.trim().toLowerCase() === normalizedEmail)
}

export async function requireResumeBetaUser(event: H3Event) {
  const auth = await requireResumeUser(event)
  const config = useRuntimeConfig(event)

  if (!hasResumeBuilderBetaAccess(auth.user.email, config.resumeBuilderBetaEmails)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Resume Builder beta access is required'
    })
  }

  return auth
}
