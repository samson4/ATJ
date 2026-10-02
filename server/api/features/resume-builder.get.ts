import { requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { user } = await requireResumeUser(event)
  const config = useRuntimeConfig()
  const allowedEmails = String(config.resumeBuilderBetaEmails || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return {
    enabled: Boolean(
      user.email && allowedEmails.includes(user.email.trim().toLowerCase())
    )
  }
})
