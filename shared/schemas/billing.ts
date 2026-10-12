import { z } from 'zod'

export const creditBalanceSchema = z.object({
  total: z.number().int().nonnegative(),
  premium: z.number().int().nonnegative(),
  free: z.number().int().nonnegative(),
  purchased: z.number().int().nonnegative()
}).strict()

export const billingStatusSchema = z.object({
  enabled: z.boolean(),
  plan: z.enum(['free', 'premium']),
  premiumUntil: z.string().nullable(),
  renewalEligible: z.boolean(),
  resumeCount: z.number().int().nonnegative(),
  resumeLimit: z.number().int().positive(),
  canCreateResume: z.boolean(),
  credits: creditBalanceSchema
}).strict()

export const billingProductSchema = z.object({
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  description: z.string().max(500),
  kind: z.enum(['premium_pass', 'credit_pack']),
  amount: z.number().positive(),
  currency: z.literal('ETB'),
  durationDays: z.number().int().positive().nullable(),
  creditAmount: z.number().int().positive(),
  available: z.boolean()
}).strict()

export const billingOrderSchema = z.object({
  id: z.uuid(),
  productCode: z.string(),
  productName: z.string(),
  amount: z.number().positive(),
  currency: z.literal('ETB'),
  status: z.enum(['pending', 'paid', 'failed', 'expired', 'refunded']),
  createdAt: z.string(),
  paidAt: z.string().nullable()
}).strict()

export const billingProductsResponseSchema = z.object({
  enabled: z.boolean(),
  products: z.array(billingProductSchema)
}).strict()

export const billingHistoryResponseSchema = z.object({
  orders: z.array(billingOrderSchema)
}).strict()

export const billingCheckoutResponseSchema = z.object({
  orderId: z.uuid(),
  checkoutUrl: z.url()
}).strict()

export type BillingStatus = z.output<typeof billingStatusSchema>
export type BillingProduct = z.output<typeof billingProductSchema>
export type BillingOrder = z.output<typeof billingOrderSchema>
