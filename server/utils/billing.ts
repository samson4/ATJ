import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { billingStatusSchema, type BillingStatus } from '~~/shared/schemas/billing'

export type AiBillingFeature = 'general_ats' | 'job_match'

const reservationSchema = z.object({
  reservationId: z.uuid(),
  status: z.enum(['reserved', 'consumed', 'released']),
  reused: z.boolean(),
  balance: z.number().int().nonnegative().optional()
}).passthrough()

export function resumeBillingEnabled(event?: H3Event) {
  const value = useRuntimeConfig(event).resumeBillingEnabled
  return value === true || String(value).toLowerCase() === 'true'
}

export function aiInputFingerprint(...values: unknown[]) {
  const hash = createHash('sha256')
  for (const value of values) hash.update(JSON.stringify(value)).update('\0')
  return hash.digest('hex')
}

export function requireIdempotencyKey(event: H3Event) {
  const parsed = z.uuid().safeParse(getHeader(event, 'idempotency-key'))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid Idempotency-Key header is required'
    })
  }
  return parsed.data
}

export async function getBillingStatus(
  supabase: { rpc: Function },
  userId: string,
  enabled = true
): Promise<BillingStatus> {
  const { data, error } = await supabase.rpc('get_resume_billing_status', { p_user_id: userId })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load billing status' })
  return billingStatusSchema.parse({ ...data, enabled })
}

export async function reserveAiCredit(options: {
  event: H3Event
  supabase: { rpc: Function }
  userId: string
  feature: AiBillingFeature
  fingerprint: string
}) {
  if (!resumeBillingEnabled(options.event)) return null
  const idempotencyKey = requireIdempotencyKey(options.event)
  const { data, error } = await options.supabase.rpc('reserve_ai_credit', {
    p_user_id: options.userId,
    p_feature: options.feature,
    p_idempotency_key: idempotencyKey,
    p_input_fingerprint: options.fingerprint
  })
  if (error) {
    const message = `${error.message || ''} ${error.details || ''}`
    if (message.includes('insufficient_ai_credits')) {
      throw createError({ statusCode: 402, statusMessage: 'AI credits required', data: { code: 'AI_CREDITS_REQUIRED' } })
    }
    if (message.includes('idempotency_conflict')) {
      throw createError({ statusCode: 409, statusMessage: 'This request key was already used for different content', data: { code: 'IDEMPOTENCY_CONFLICT' } })
    }
    throw createError({ statusCode: 500, statusMessage: 'Could not reserve an AI credit' })
  }
  const reservation = reservationSchema.parse(data)
  if (reservation.reused && reservation.status === 'reserved') {
    throw createError({ statusCode: 409, statusMessage: 'This AI request is already being processed', data: { code: 'AI_REQUEST_IN_PROGRESS' } })
  }
  if (reservation.reused && reservation.status === 'released') {
    throw createError({ statusCode: 409, statusMessage: 'Retry this operation to create a new request', data: { code: 'AI_REQUEST_RELEASED' } })
  }
  return reservation
}

export async function consumeAiCredit(
  supabase: { rpc: Function },
  userId: string,
  reservationId?: string
) {
  if (!reservationId) return
  const { error } = await supabase.rpc('consume_ai_credit', {
    p_user_id: userId,
    p_reservation_id: reservationId
  })
  if (error) throw new Error('Could not finalize AI credit')
}

export async function releaseAiCredit(
  supabase: { rpc: Function },
  userId: string,
  reservationId: string | undefined,
  failureCode: string
) {
  if (!reservationId) return
  await supabase.rpc('release_ai_credit', {
    p_user_id: userId,
    p_reservation_id: reservationId,
    p_failure_code: failureCode
  })
}
