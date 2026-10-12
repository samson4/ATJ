<script setup lang="ts">
import { useBillingStore } from '~/stores/billing'

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'Billing | Addis Tech Jobs', robots: 'noindex, nofollow' })

const billing = useBillingStore()
const toast = useToast()
const purchasing = ref('')

onMounted(() => billing.refresh().catch((error: any) => {
  toast.add({ title: 'Could not load billing', description: error.data?.statusMessage || error.message, color: 'error' })
}))

async function purchase(code: string) {
  purchasing.value = code
  try { await billing.checkout(code) }
  catch (error: any) {
    toast.add({ title: 'Could not start checkout', description: error.data?.statusMessage || error.message, color: 'error' })
    purchasing.value = ''
  }
}

function date(value?: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—'
}
</script>

<template>
  <UContainer class="py-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-highlighted">Plan and billing</h1>
        <p class="mt-1 text-muted">Manage resume capacity and AI credits. Premium is a manually renewable 30-day pass.</p>
      </div>

      <div v-if="billing.loading && !billing.status" class="grid gap-4 md:grid-cols-3">
        <USkeleton v-for="item in 3" :key="item" class="h-36" />
      </div>
      <template v-else-if="billing.status">
        <div class="grid gap-4 md:grid-cols-3">
          <UCard><p class="text-sm text-muted">Current plan</p><p class="mt-2 text-2xl font-bold capitalize">{{ billing.status.plan }}</p><p class="mt-1 text-xs text-muted">{{ billing.status.plan === 'premium' ? `Ends ${date(billing.status.premiumUntil)}` : 'No expiration' }}</p></UCard>
          <UCard><p class="text-sm text-muted">AI credits</p><p class="mt-2 text-2xl font-bold">{{ billing.status.credits.total }}</p><p class="mt-1 text-xs text-muted">{{ billing.status.credits.premium }} Premium · {{ billing.status.credits.free }} free · {{ billing.status.credits.purchased }} purchased</p></UCard>
          <UCard><p class="text-sm text-muted">Resumes</p><p class="mt-2 text-2xl font-bold">{{ billing.status.resumeCount }}/{{ billing.status.resumeLimit }}</p><UProgress class="mt-3" :model-value="billing.status.resumeCount" :max="billing.status.resumeLimit" /></UCard>
        </div>

        <UAlert v-if="!billing.status.enabled" color="warning" icon="i-lucide-clock" title="Purchases are not available yet" description="Your plan and introductory credits are visible, but checkout has not been enabled." />

        <section>
          <h2 class="mb-3 text-xl font-semibold">Plans and credits</h2>
          <div class="grid gap-4 md:grid-cols-3 md:items-stretch">
            <BillingProductCard
              v-for="product in billing.products"
              :key="product.code"
              :product="product"
              :featured="product.kind === 'premium_pass'"
              :action-label="product.kind === 'premium_pass' && billing.status.plan === 'premium' ? 'Renew Premium' : product.kind === 'premium_pass' ? 'Get Premium' : `Buy ${product.creditAmount} credits`"
              :loading="purchasing === product.code"
              :disabled="!product.available || (product.kind === 'premium_pass' && billing.status.plan === 'premium' && !billing.status.renewalEligible)"
              :note="product.kind === 'premium_pass' && billing.status.plan === 'premium' && !billing.status.renewalEligible ? 'Renewal opens in the final 7 days.' : undefined"
              @select="purchase"
            />
          </div>
        </section>

        <section>
          <h2 class="mb-3 text-xl font-semibold">Payment history</h2>
          <UCard v-if="!billing.orders.length"><p class="text-sm text-muted">No payments yet.</p></UCard>
          <div v-else class="overflow-hidden rounded-lg border border-default">
            <div v-for="order in billing.orders" :key="order.id" class="flex items-center justify-between gap-4 border-b border-default p-4 last:border-b-0">
              <div><p class="font-medium text-highlighted">{{ order.productName }}</p><p class="text-xs text-muted">{{ date(order.createdAt) }}</p></div>
              <div class="text-right"><p class="font-medium">{{ order.amount }} {{ order.currency }}</p><UBadge :label="order.status" :color="order.status === 'paid' ? 'success' : order.status === 'pending' ? 'warning' : 'neutral'" variant="subtle" class="capitalize" /></div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </UContainer>
</template>
