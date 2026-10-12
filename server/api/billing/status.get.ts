import { getBillingStatus, resumeBillingEnabled } from '../../utils/billing'
import { requireResumeUser } from '../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return getBillingStatus(supabase, user.id, resumeBillingEnabled(event))
})
