import { requireServerSupabase } from '../../utils/serverSupabase'
import { resumeBillingEnabled } from '../../utils/billing'

export default defineEventHandler(async (event) => {
  const supabase = requireServerSupabase(event)
  const enabled = resumeBillingEnabled(event)
  const { data, error } = await supabase.from('billing_products')
    .select('code, name, description, kind, amount, currency, duration_days, credit_amount')
    .eq('active', true)
    .order('sort_order')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load billing products' })
  return {
    enabled,
    products: (data || []).map(product => ({
      code: product.code,
      name: product.name,
      description: product.description,
      kind: product.kind,
      amount: Number(product.amount),
      currency: product.currency,
      durationDays: product.duration_days,
      creditAmount: product.credit_amount,
      available: enabled
    }))
  }
})
