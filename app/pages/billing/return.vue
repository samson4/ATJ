<script setup lang="ts">
import { billingOrderSchema } from '~~/shared/schemas/billing'

definePageMeta({ layout: 'default', middleware: ['auth', 'resume-beta'] })
useSeoMeta({ title: 'Payment status | Addis Tech Jobs', robots: 'noindex, nofollow' })

const route = useRoute()
const { $supabase } = useNuxtApp()
const state = ref<'checking' | 'paid' | 'pending' | 'failed'>('checking')
let timer: ReturnType<typeof setTimeout> | undefined

async function check(attempt = 0) {
  const orderId = String(route.query.order || '')
  if (!orderId) { state.value = 'failed'; return }
  const { data: { session } } = await $supabase.auth.getSession()
  if (!session) { state.value = 'failed'; return }
  try {
    const order = billingOrderSchema.parse(await $fetch(`/api/billing/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    }))
    if (order.status === 'paid') state.value = 'paid'
    else if (['failed', 'expired', 'refunded'].includes(order.status)) state.value = 'failed'
    else if (attempt < 10) timer = setTimeout(() => check(attempt + 1), 2000)
    else state.value = 'pending'
  } catch { state.value = 'failed' }
}

onMounted(() => check())
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <UContainer class="py-16"><UCard class="mx-auto max-w-lg"><div class="py-8 text-center">
    <UIcon v-if="state === 'checking'" name="i-lucide-loader-circle" class="mx-auto size-10 animate-spin text-primary" />
    <UIcon v-else-if="state === 'paid'" name="i-lucide-circle-check" class="mx-auto size-10 text-success" />
    <UIcon v-else name="i-lucide-clock" class="mx-auto size-10 text-warning" />
    <h1 class="mt-4 text-xl font-semibold">{{ state === 'checking' ? 'Confirming payment…' : state === 'paid' ? 'Payment confirmed' : state === 'pending' ? 'Payment is still pending' : 'Payment was not completed' }}</h1>
    <p class="mt-2 text-sm text-muted">{{ state === 'paid' ? 'Your plan and credits are ready.' : state === 'pending' ? 'We will update your account when Chapa confirms the payment.' : state === 'failed' ? 'Return to billing to try again.' : 'Please keep this page open.' }}</p>
    <UButton v-if="state !== 'checking'" to="/billing" label="Return to billing" class="mt-5" />
  </div></UCard></UContainer>
</template>
