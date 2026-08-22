import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization token'
    })
  }

  if (!config.public.SUPABASE_URL || !config.SUPABASE_SECRET_KEY) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server configuration is missing'
    })
  }

  const supabase = createClient(
    config.public.SUPABASE_URL,
    config.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authorization token'
    })
  }

  const deactivatedAt = new Date().toISOString()

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: '876000h',
    app_metadata: {
      ...user.app_metadata,
      account_status: 'deactivated',
      deactivated_at: deactivatedAt
    }
  })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Could not deactivate account'
    })
  }

  return { success: true, deactivated_at: deactivatedAt }
})
