import { defineStore } from 'pinia'
import {
  billingCheckoutResponseSchema,
  billingHistoryResponseSchema,
  billingProductsResponseSchema,
  billingStatusSchema
} from '~~/shared/schemas/billing'
import type { BillingOrder, BillingProduct, BillingStatus } from '~~/shared/types/billing'

export const useBillingStore = defineStore('billing', () => {
  const status = ref<BillingStatus>()
  const products = ref<BillingProduct[]>([])
  const orders = ref<BillingOrder[]>([])
  const loading = ref(false)

  async function token() {
    const { $supabase } = useNuxtApp()
    const { data: { session } } = await $supabase.auth.getSession()
    if (!session?.access_token) throw new Error('You need to sign in again.')
    return session.access_token
  }

  async function fetchStatus() {
    const accessToken = await token()
    status.value = billingStatusSchema.parse(await $fetch('/api/billing/status', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }))
    return status.value
  }

  async function fetchProducts() {
    const response = billingProductsResponseSchema.parse(await $fetch('/api/billing/products'))
    products.value = response.products
    return response
  }

  async function fetchOrders() {
    const accessToken = await token()
    const response = billingHistoryResponseSchema.parse(await $fetch('/api/billing/orders', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }))
    orders.value = response.orders
    return orders.value
  }

  async function checkout(productCode: string) {
    const accessToken = await token()
    const response = billingCheckoutResponseSchema.parse(await $fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { productCode }
    }))
    window.location.assign(response.checkoutUrl)
  }

  async function refresh() {
    loading.value = true
    try { await Promise.all([fetchStatus(), fetchProducts(), fetchOrders()]) }
    finally { loading.value = false }
  }

  return { status, products, orders, loading, fetchStatus, fetchProducts, fetchOrders, checkout, refresh }
})
