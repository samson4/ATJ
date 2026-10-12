import { requireResumeUser } from '../../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'Missing order ID' })
  const { supabase, user } = await requireResumeUser(event)
  const { data, error } = await supabase.from('billing_orders')
    .select('id, product_code, product_name, amount, currency, status, created_at, paid_at')
    .eq('id', orderId).eq('user_id', user.id).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load payment' })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Payment not found' })
  return {
    id: data.id,
    productCode: data.product_code,
    productName: data.product_name,
    amount: Number(data.amount),
    currency: data.currency,
    status: data.status,
    createdAt: data.created_at,
    paidAt: data.paid_at
  }
})
