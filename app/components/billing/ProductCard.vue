<script setup lang="ts">
import type { BillingProduct } from '~~/shared/types/billing'

const props = withDefaults(defineProps<{
  product: BillingProduct
  featured?: boolean
  actionLabel?: string
  actionTo?: string
  loading?: boolean
  disabled?: boolean
  note?: string
}>(), {
  featured: false,
  actionLabel: 'Purchase',
  actionTo: undefined,
  loading: false,
  disabled: false,
  note: undefined
})

const emit = defineEmits<{
  select: [productCode: string]
}>()

const isPremium = computed(() => props.product.kind === 'premium_pass')
const badge = computed(() => isPremium.value ? `${props.product.durationDays || 30}-day pass` : 'One-time')
const priceSuffix = computed(() => isPremium.value ? `/ ${props.product.durationDays || 30} days` : 'one-time')
const benefits = computed(() => isPremium.value
  ? [
      `${props.product.creditAmount} AI credits included`,
      'Up to 25 saved resumes',
      'Manual renewal—no automatic charge'
    ]
  : [
      `${props.product.creditAmount} non-expiring AI credits`,
      'Works with Free or Premium',
      'Use whenever you need a fresh analysis'
    ])

function selectProduct() {
  if (!props.actionTo) emit('select', props.product.code)
}
</script>

<template>
  <article
    class="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl p-6 sm:p-7"
    :class="featured
      ? 'bg-inverted shadow-xl shadow-primary/10 ring-1 ring-primary/40'
      : 'border border-default bg-default shadow-sm'"
  >
    <div v-if="featured" class="absolute -right-16 -top-20 size-48 rounded-full bg-primary/20 blur-3xl" />

    <div class="relative flex min-w-0 items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-xl font-semibold" :class="featured ? 'text-inverted' : 'text-highlighted'">
          {{ product.name }}
        </h3>
        <p class="mt-2 min-h-10 text-sm leading-5" :class="featured ? 'text-inverted/65' : 'text-muted'">
          {{ product.description }}
        </p>
      </div>
      <UBadge :label="badge" :color="featured ? 'primary' : 'neutral'" :variant="featured ? 'solid' : 'subtle'" />
    </div>

    <div
      class="relative mt-6 flex flex-wrap items-end gap-x-2 gap-y-1 border-b pb-6"
      :class="featured ? 'border-inverted/15' : 'border-muted'"
    >
      <span class="text-4xl font-bold tracking-[-0.04em]" :class="featured ? 'text-inverted' : 'text-highlighted'">
        {{ product.amount }}
      </span>
      <span class="pb-1 text-sm font-medium" :class="featured ? 'text-inverted/60' : 'text-muted'">
        {{ product.currency }} · {{ priceSuffix }}
      </span>
    </div>

    <ul class="relative mt-6 flex-1 space-y-3">
      <li
        v-for="benefit in benefits"
        :key="benefit"
        class="flex gap-3 text-sm leading-5"
        :class="featured ? 'text-inverted/75' : 'text-toned'"
      >
        <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <UIcon name="i-lucide-check" class="size-3.5 text-primary" />
        </span>
        {{ benefit }}
      </li>
    </ul>

    <UButton
      :to="actionTo"
      :label="actionLabel"
      :color="featured ? 'primary' : 'neutral'"
      :variant="featured ? 'solid' : 'outline'"
      :loading="loading"
      :disabled="disabled"
      size="lg"
      block
      class="relative mt-7"
      @click="selectProduct"
    />

    <p v-if="note" class="relative mt-2 text-xs" :class="featured ? 'text-inverted/60' : 'text-muted'">
      {{ note }}
    </p>
  </article>
</template>
