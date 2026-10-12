import { fulfillChapaOrder } from '../../../utils/billingOrders'
import { requireServerSupabase } from '../../../utils/serverSupabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const txRef = String(query.trx_ref || query.tx_ref || '')
  if (!txRef) throw createError({ statusCode: 400, statusMessage: 'Missing transaction reference' })
  const config = useRuntimeConfig(event)
  if (!config.CHAPA_SECRET_KEY) throw createError({ statusCode: 503, statusMessage: 'Payments are not configured' })
  try {
    await fulfillChapaOrder({
      supabase: requireServerSupabase(event),
      secretKey: config.CHAPA_SECRET_KEY,
      expectedMode: String(config.chapaMode || 'test'),
      txRef
    })
    return { received: true }
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'Payment could not be verified' })
  }
})
