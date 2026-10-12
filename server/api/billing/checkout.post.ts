import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getBillingStatus, resumeBillingEnabled } from '../../utils/billing'
import { ChapaApiError, initializeChapaPayment } from '../../utils/chapa'
import { requireResumeUser } from '../../utils/resumeAuth'

const requestSchema = z.object({ productCode: z.string().min(1).max(80) }).strict()
const attempts = new Map<string, number[]>()

function allowCheckout(userId: string) {
  const cutoff = Date.now() - 10 * 60_000
  const recent = (attempts.get(userId) || []).filter(value => value > cutoff)
  if (recent.length >= 5) return false
  recent.push(Date.now())
  attempts.set(userId, recent)
  return true
}

export default defineEventHandler(async (event) => {
  if (!resumeBillingEnabled(event)) throw createError({ statusCode: 503, statusMessage: 'Billing is not available yet' })
  const request = requestSchema.safeParse(await readBody(event))
  if (!request.success) throw createError({ statusCode: 400, statusMessage: 'Invalid billing product' })
  const { supabase, user } = await requireResumeUser(event)
  if (!user.email || !user.email_confirmed_at) {
    throw createError({ statusCode: 403, statusMessage: 'Verify your email before purchasing' })
  }
  if (!allowCheckout(user.id)) throw createError({ statusCode: 429, statusMessage: 'Too many checkout attempts' })

  const { data: product, error: productError } = await supabase.from('billing_products')
    .select('code, name, description, kind, amount, currency, plan_code, duration_days, credit_amount')
    .eq('code', request.data.productCode).eq('active', true).maybeSingle()
  if (productError || !product) throw createError({ statusCode: 404, statusMessage: 'Billing product not found' })

  if (product.kind === 'premium_pass') {
    const status = await getBillingStatus(supabase, user.id, true)
    if (status.plan === 'premium' && !status.renewalEligible) {
      throw createError({ statusCode: 409, statusMessage: 'Premium renewal opens during the final 7 days', data: { code: 'RENEWAL_NOT_OPEN' } })
    }
  }

  const config = useRuntimeConfig(event)
  if (!config.CHAPA_SECRET_KEY) throw createError({ statusCode: 503, statusMessage: 'Payments are not configured' })
  const baseUrlResult = z.url().safeParse(String(config.appBaseUrl).replace(/\/$/, ''))
  if (!baseUrlResult.success || !baseUrlResult.data.startsWith('https://')) {
    throw createError({ statusCode: 503, statusMessage: 'Payment return URL is not configured correctly' })
  }

  const txRef = `atj-${randomBytes(18).toString('hex')}`
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const names = String(profile?.full_name || '').trim().split(/\s+/).filter(Boolean)
  const firstName = names[0] || 'Addis Tech Jobs'
  const lastName = names.slice(1).join(' ') || 'Customer'
  const { data: order, error: orderError } = await supabase.from('billing_orders').insert({
    user_id: user.id,
    product_code: product.code,
    product_name: product.name,
    product_kind: product.kind,
    plan_code: product.plan_code,
    duration_days: product.duration_days,
    credit_amount: product.credit_amount,
    amount: product.amount,
    currency: product.currency,
    tx_ref: txRef
  }).select('id').single()
  if (orderError || !order) throw createError({ statusCode: 500, statusMessage: 'Could not create payment' })

  const baseUrl = baseUrlResult.data
  try {
    const checkoutUrl = await initializeChapaPayment({
      secretKey: config.CHAPA_SECRET_KEY,
      amount: Number(product.amount).toFixed(2),
      currency: product.currency,
      email: user.email,
      firstName,
      lastName,
      txRef,
      callbackUrl: `${baseUrl}/api/billing/chapa/callback`,
      returnUrl: `${baseUrl}/billing/return?order=${encodeURIComponent(order.id)}`,
      title: product.name,
      description: product.description
    })
    await supabase.from('billing_orders').update({ checkout_url: checkoutUrl, updated_at: new Date().toISOString() }).eq('id', order.id)
    return { orderId: order.id, checkoutUrl }
  } catch (error) {
    const providerStatus = error instanceof ChapaApiError ? error.providerStatus : undefined
    const failureCode = providerStatus ? `initialization_http_${providerStatus}` : 'initialization_failed'
    await supabase.from('billing_orders').update({ status: 'failed', failure_code: failureCode, updated_at: new Date().toISOString() }).eq('id', order.id)
    throw createError({
      statusCode: 503,
      statusMessage: error instanceof ChapaApiError ? error.message : 'Payment checkout is temporarily unavailable',
      data: { code: 'CHAPA_INITIALIZATION_FAILED', providerStatus }
    })
  }
})
