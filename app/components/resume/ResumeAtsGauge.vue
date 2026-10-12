<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  value?: number
  size?: 'compact' | 'large'
  hasScore?: boolean
  outdated?: boolean
  decorative?: boolean
}>(), {
  value: 0,
  size: 'compact',
  hasScore: false,
  outdated: false,
  decorative: false
})

const score = computed(() => Math.min(100, Math.max(0, Math.round(Number(props.value) || 0))))
const markerAngle = computed(() => Math.PI - (score.value / 100 * Math.PI))
const markerX = computed(() => 60 + (50 * Math.cos(markerAngle.value)))
const markerY = computed(() => 60 - (50 * Math.sin(markerAngle.value)))
const gradientId = `ats-gauge-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
const accessibleLabel = computed(() => props.hasScore
  ? `ATS readiness score: ${score.value} out of 100${props.outdated ? ', score is out of date' : ''}`
  : 'No ATS readiness score yet: 0 out of 100')
const sizeClass = computed(() => props.size === 'large' ? 'h-32 w-56' : 'h-8 w-14')
const scoreClass = computed(() => props.size === 'large' ? 'text-[17px] font-bold' : 'text-[20px] font-bold')
</script>

<template>
  <svg
    viewBox="0 0 120 72"
    :class="['shrink-0 overflow-visible', sizeClass]"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : accessibleLabel"
  >
    <title v-if="!decorative">{{ accessibleLabel }}</title>
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--ui-error, #ef4444)" />
        <stop offset="52%" stop-color="var(--ui-warning, #f59e0b)" />
        <stop offset="100%" stop-color="var(--ui-success, #22c55e)" />
      </linearGradient>
    </defs>

    <path
      d="M 10 60 A 50 50 0 0 1 110 60"
      fill="none"
      :stroke="`url(#${gradientId})`"
      stroke-width="11"
      stroke-linecap="round"
      opacity="0.25"
    />
    <path
      d="M 10 60 A 50 50 0 0 1 110 60"
      fill="none"
      :stroke="`url(#${gradientId})`"
      stroke-width="11"
      stroke-linecap="round"
      pathLength="100"
      :stroke-dasharray="`${score} 100`"
      class="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
    />

    <circle
      :cx="markerX"
      :cy="markerY"
      r="5"
      fill="var(--ui-bg)"
      stroke="var(--ui-text-highlighted)"
      stroke-width="3"
      class="transition-all duration-500 motion-reduce:transition-none"
    />
    <text
      x="60"
      y="50"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="var(--ui-text-highlighted)"
      :class="scoreClass"
    >
      {{ score }}
    </text>

    <circle
      v-if="outdated"
      cx="108"
      cy="12"
      r="5"
      fill="var(--ui-warning)"
      stroke="var(--ui-bg)"
      stroke-width="2"
    />
  </svg>
</template>
