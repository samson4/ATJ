import { hasResumeBuilderBetaAccess, requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { user } = await requireResumeUser(event)
  const config = useRuntimeConfig()

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return {
    enabled: hasResumeBuilderBetaAccess(user.email, config.resumeBuilderBetaEmails)
  }
})
