import { fulfillChapaOrder } from '../../../utils/billingOrders'
import { validChapaSignature } from '../../../utils/chapa'
import { requireServerSupabase } from '../../../utils/serverSupabase'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.CHAPA_SECRET_KEY || !config.CHAPA_WEBHOOK_SECRET) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured' })
  }
  const rawBody = await readRawBody(event, 'utf8') || ''
  if (!rawBody || rawBody.length > 32_768) throw createError({ statusCode: 400, statusMessage: 'Invalid webhook payload' })
  const bodySignature = getHeader(event, 'x-chapa-signature')
  const secretSignature = getHeader(event, 'chapa-signature')
  const validSignature = validChapaSignature(rawBody, bodySignature, config.CHAPA_WEBHOOK_SECRET)
    || validChapaSignature(config.CHAPA_WEBHOOK_SECRET, secretSignature, config.CHAPA_WEBHOOK_SECRET)
  if (!validSignature) throw createError({ statusCode: 401, statusMessage: 'Invalid webhook signature' })

  let payload: any
  try { payload = JSON.parse(rawBody) } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid webhook payload' }) }
  const txRef = String(payload?.tx_ref || payload?.trx_ref || payload?.data?.tx_ref || payload?.data?.trx_ref || '')
  if (!txRef) return { received: true }
  try {
    await fulfillChapaOrder({
      supabase: requireServerSupabase(event),
      secretKey: config.CHAPA_SECRET_KEY,
      expectedMode: String(config.chapaMode || 'test'),
      txRef
    })
    return { received: true }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Payment verification failed' })
  }
})
