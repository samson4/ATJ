import { requireResumeUser } from '../../../utils/resumeAuth'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await requireResumeUser(event)
  const { data, error } = await supabase.from('billing_orders')
    .select('id, product_code, product_name, amount, currency, status, created_at, paid_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load payment history' })
  return {
    orders: (data || []).map(order => ({
      id: order.id,
      productCode: order.product_code,
      productName: order.product_name,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      createdAt: order.created_at,
      paidAt: order.paid_at
    }))
  }
})
