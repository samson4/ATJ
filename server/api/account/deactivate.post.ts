import { requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)

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
