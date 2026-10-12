import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const initializeSchema = z.object({
  status: z.string(),
  data: z.object({ checkout_url: z.url() })
}).passthrough()

const verifySchema = z.object({
  status: z.string(),
  data: z.object({
    status: z.string(),
    tx_ref: z.string(),
    reference: z.string(),
    amount: z.union([z.string(), z.number()]),
    currency: z.string(),
    mode: z.string()
  }).passthrough()
}).passthrough()

function chapaHeaders(secretKey: string) {
  return { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
}

function chapaTitle(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._ -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16)
    .trim()
  return normalized || 'Addis Tech Jobs'
}

export class ChapaApiError extends Error {
  constructor(
    message: string,
    readonly operation: 'initialize' | 'verify',
    readonly providerStatus?: number
  ) {
    super(message)
    this.name = 'ChapaApiError'
  }
}

async function chapaError(response: Response, operation: 'initialize' | 'verify') {
  let message = `Chapa ${operation} request failed`
  try {
    const body = await response.json() as Record<string, unknown>
    const details: string[] = []
    const collect = (value: unknown, label = '', depth = 0) => {
      if (depth > 3 || details.length >= 6) return
      if (typeof value === 'string') {
        const sanitized = value.replace(/[^\p{L}\p{N}\s.,:;()'"/_-]/gu, '').trim().slice(0, 140)
        if (sanitized && !['failed', 'error'].includes(sanitized.toLowerCase())) {
          details.push(label ? `${label}: ${sanitized}` : sanitized)
        }
        return
      }
      if (Array.isArray(value)) {
        for (const item of value) collect(item, label, depth + 1)
        return
      }
      if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
          const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40)
          collect(item, label || safeKey, depth + 1)
        }
      }
    }
    collect(body.message)
    collect(body.data)
    collect(body.errors)
    if (details.length) message = details.join('; ').slice(0, 300)
  } catch {
    // Chapa occasionally returns an HTML or empty error response.
  }
  return new ChapaApiError(message, operation, response.status)
}

export async function initializeChapaPayment(options: {
  secretKey: string
  amount: string
  currency: string
  email: string
  firstName: string
  lastName: string
  txRef: string
  callbackUrl: string
  returnUrl: string
  title: string
  description: string
}) {
  const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
    method: 'POST',
    headers: chapaHeaders(options.secretKey),
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      amount: options.amount,
      currency: options.currency,
      email: options.email,
      first_name: options.firstName,
      last_name: options.lastName,
      tx_ref: options.txRef,
      callback_url: options.callbackUrl,
      return_url: options.returnUrl,
      customization: { title: chapaTitle(options.title), description: options.description }
    })
  })
  if (!response.ok) throw await chapaError(response, 'initialize')
  return initializeSchema.parse(await response.json()).data.checkout_url
}

export async function verifyChapaPayment(secretKey: string, txRef: string) {
  const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: chapaHeaders(secretKey),
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw await chapaError(response, 'verify')
  return verifySchema.parse(await response.json()).data
}

export function validChapaSignature(rawBody: string, signature: string | undefined, secret: string) {
  if (!signature || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const received = Buffer.from(signature.trim().toLowerCase(), 'utf8')
  const calculated = Buffer.from(expected, 'utf8')
  return received.length === calculated.length && timingSafeEqual(received, calculated)
}
