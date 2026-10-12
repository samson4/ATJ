import { requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)
  const email = user.email?.trim().toLowerCase()

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  if (!email) return { joined: false }

  const { data, error } = await supabase
    .from('resume_builder_waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'We could not check your waitlist status right now.'
    })
  }

  return { joined: Boolean(data) }
})
