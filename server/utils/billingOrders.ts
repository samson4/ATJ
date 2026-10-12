import type { SupabaseClient } from '@supabase/supabase-js'
import { verifyChapaPayment } from './chapa'

function money(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error('Invalid payment amount')
  return parsed.toFixed(2)
}

export async function fulfillChapaOrder(options: {
  supabase: SupabaseClient
  secretKey: string
  expectedMode: string
  txRef: string
}) {
  const { data: order, error } = await options.supabase.from('billing_orders')
    .select('id, tx_ref, amount, currency, status')
    .eq('tx_ref', options.txRef)
    .maybeSingle()
  if (error || !order) throw new Error('Billing order not found')
  if (order.status === 'paid') return order
  if (order.status !== 'pending') throw new Error('Billing order cannot be completed')

  const verified = await verifyChapaPayment(options.secretKey, order.tx_ref)
  const valid = verified.status.toLowerCase() === 'success'
    && verified.tx_ref === order.tx_ref
    && money(verified.amount) === money(order.amount)
    && verified.currency.toUpperCase() === String(order.currency).toUpperCase()
    && verified.mode.toLowerCase() === options.expectedMode.toLowerCase()
  if (!valid) throw new Error('Payment verification did not match the order')

  const { error: applyError } = await options.supabase.rpc('apply_verified_billing_order', {
    p_order_id: order.id,
    p_provider_reference: verified.reference,
    p_provider_mode: verified.mode.toLowerCase()
  })
  if (applyError) throw new Error('Could not apply verified payment')
  return { ...order, status: 'paid' }
}
