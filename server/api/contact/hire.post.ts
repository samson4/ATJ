import { z } from 'zod'
import { createHash } from 'node:crypto'

const hireInquirySchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(120),
  email: z.email('Enter a valid work email').max(320),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  otherContact: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Tell us about the roles you need').max(4000)
}).strict()

const rateLimitAttempts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5

function clientKey(event: Parameters<typeof getRequestIP>[0], email: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return createHash('sha256').update(`${ip}:${email.toLowerCase()}`).digest('hex')
}

function assertRateLimit(key: string) {
  const now = Date.now()
  for (const [entryKey, attempts] of rateLimitAttempts) {
    const active = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS)
    if (active.length) rateLimitAttempts.set(entryKey, active)
    else rateLimitAttempts.delete(entryKey)
  }

  const attempts = rateLimitAttempts.get(key) || []
  if (attempts.length >= RATE_LIMIT_MAX) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many inquiries. Please try again in a few minutes.'
    })
  }

  attempts.push(now)
  rateLimitAttempts.set(key, attempts)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default defineEventHandler(async (event) => {
  const parsed = hireInquirySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid inquiry'
    })
  }

  const inquiry = {
    name: parsed.data.name,
    email: parsed.data.email.trim().toLowerCase(),
    company: parsed.data.company?.trim() || '',
    otherContact: parsed.data.otherContact?.trim() || '',
    message: parsed.data.message
  }

  assertRateLimit(clientKey(event, inquiry.email))

  const config = useRuntimeConfig(event)
  const toEmail = (config.public.CONTACT_EMAIL || 'hello@addistechjobs.work').trim()
  const apiKey = String(config.resendApiKey || '').trim()

  if (!apiKey) {
    console.error('Hire inquiry blocked: RESEND_API_KEY is not configured')
    throw createError({
      statusCode: 503,
      statusMessage: `Email is temporarily unavailable. Please write to ${toEmail}.`
    })
  }

  const subject = inquiry.company
    ? `Hiring inquiry from ${inquiry.name} at ${inquiry.company}`
    : `Hiring inquiry from ${inquiry.name}`

  const textLines = [
    'New employer hiring inquiry from addistechjobs.work/contact',
    '',
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company: ${inquiry.company || '—'}`,
    `Other contact: ${inquiry.otherContact || '—'}`,
    '',
    'Message:',
    inquiry.message
  ]

  const html = `
    <h2>New employer hiring inquiry</h2>
    <p>Submitted from the contact/about page employer form.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(inquiry.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(inquiry.email)}</td></tr>
      <tr><td><strong>Company</strong></td><td>${escapeHtml(inquiry.company || '—')}</td></tr>
      <tr><td><strong>Other contact</strong></td><td>${escapeHtml(inquiry.otherContact || '—')}</td></tr>
    </table>
    <p><strong>Message</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: config.contactFromEmail,
      to: [toEmail],
      reply_to: inquiry.email,
      subject,
      text: textLines.join('\n'),
      html
    })
  })

  setResponseHeader(event, 'Cache-Control', 'no-store')

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Resend hire inquiry failed', {
      status: response.status,
      detail: detail.slice(0, 500)
    })
    throw createError({
      statusCode: 502,
      statusMessage: `We could not send your inquiry. Please email ${toEmail}.`
    })
  }

  return { sent: true }
})
