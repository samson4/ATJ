import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { aiInputFingerprint } from '../server/utils/billing'
import { ChapaApiError, initializeChapaPayment, validChapaSignature, verifyChapaPayment } from '../server/utils/chapa'
import { billingStatusSchema } from '../shared/schemas/billing'

afterEach(() => vi.restoreAllMocks())

describe('paid resume builder billing', () => {
  it('validates strict billing status data', () => {
    expect(billingStatusSchema.parse({
      enabled: true,
      plan: 'free',
      premiumUntil: null,
      renewalEligible: false,
      resumeCount: 2,
      resumeLimit: 5,
      canCreateResume: true,
      credits: { total: 3, premium: 0, free: 3, purchased: 0 }
    }).credits.total).toBe(3)

    expect(() => billingStatusSchema.parse({
      enabled: true,
      plan: 'free',
      premiumUntil: null,
      renewalEligible: false,
      resumeCount: 2,
      resumeLimit: 5,
      canCreateResume: true,
      credits: { total: -1, premium: 0, free: 0, purchased: 0 }
    })).toThrow()
  })

  it('creates stable and content-sensitive AI fingerprints', () => {
    expect(aiInputFingerprint('resume', { value: 1 })).toBe(aiInputFingerprint('resume', { value: 1 }))
    expect(aiInputFingerprint('resume', { value: 1 })).not.toBe(aiInputFingerprint('resume', { value: 2 }))
    expect(aiInputFingerprint('resume', { value: 1 })).toMatch(/^[a-f0-9]{64}$/)
  })

  it('verifies webhook signatures without accepting altered bodies', () => {
    const body = JSON.stringify({ tx_ref: 'atj-test' })
    const secret = 'webhook-secret'
    const signature = createHmac('sha256', secret).update(body).digest('hex')
    expect(validChapaSignature(body, signature, secret)).toBe(true)
    expect(validChapaSignature(`${body} `, signature, secret)).toBe(false)
    expect(validChapaSignature(body, 'invalid', secret)).toBe(false)
  })

  it('initializes checkout using only the server-provided values', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'success', data: { checkout_url: 'https://checkout.chapa.co/example' }
    }), { status: 200, headers: { 'content-type': 'application/json' } }))

    const checkoutUrl = await initializeChapaPayment({
      secretKey: 'secret', amount: '299.00', currency: 'ETB', email: 'user@example.com',
      firstName: 'Test', lastName: 'User', txRef: 'atj-reference',
      callbackUrl: 'https://example.com/api/billing/chapa/callback',
      returnUrl: 'https://example.com/billing/return?order=1',
      title: 'Premium', description: '30 days'
    })

    expect(checkoutUrl).toBe('https://checkout.chapa.co/example')
    const request = fetchMock.mock.calls[0]!
    expect(request[0]).toBe('https://api.chapa.co/v1/transaction/initialize')
    expect(JSON.parse(String((request[1] as RequestInit).body))).toMatchObject({
      amount: '299.00',
      currency: 'ETB',
      tx_ref: 'atj-reference',
      customization: { title: 'Premium', description: '30 days' }
    })
  })

  it('normalizes checkout titles to Chapa constraints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'success', data: { checkout_url: 'https://checkout.chapa.co/example' }
    }), { status: 200, headers: { 'content-type': 'application/json' } }))

    await initializeChapaPayment({
      secretKey: 'secret', amount: '299.00', currency: 'ETB', email: 'user@example.com',
      firstName: 'Test', lastName: 'User', txRef: 'atj-reference',
      callbackUrl: 'https://example.com/api/billing/chapa/callback',
      returnUrl: 'https://example.com/billing/return?order=1',
      title: 'Premium · 30 days', description: '30 days'
    })

    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body))
    expect(body.customization.title).toBe('Premium 30 days')
    expect(body.customization.title.length).toBeLessThanOrEqual(16)
  })

  it('preserves a sanitized Chapa initialization error without exposing its payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'failed', message: 'failed', data: {
        callback_url: ['Invalid callback URL: https://example.com/<script>']
      }
    }), { status: 400, headers: { 'content-type': 'application/json' } }))

    const result = initializeChapaPayment({
      secretKey: 'secret', amount: '299.00', currency: 'ETB', email: 'user@example.com',
      firstName: 'Test', lastName: 'User', txRef: 'atj-reference',
      callbackUrl: 'https://example.com/api/billing/chapa/callback',
      returnUrl: 'https://example.com/billing/return?order=1',
      title: 'Premium', description: '30 days'
    })

    await expect(result).rejects.toMatchObject({
      name: 'ChapaApiError', operation: 'initialize', providerStatus: 400,
      message: 'callback_url: Invalid callback URL: https://example.com/script'
    } satisfies Partial<ChapaApiError>)
    await expect(result).rejects.not.toThrow('<script>')
  })

  it('strictly parses the fields needed to verify a Chapa transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'success',
      data: { status: 'success', tx_ref: 'atj-reference', reference: 'provider-reference', amount: 299, currency: 'ETB', mode: 'test' }
    }), { status: 200, headers: { 'content-type': 'application/json' } }))

    await expect(verifyChapaPayment('secret', 'atj-reference')).resolves.toMatchObject({
      status: 'success', tx_ref: 'atj-reference', amount: 299, currency: 'ETB', mode: 'test'
    })
  })
})
