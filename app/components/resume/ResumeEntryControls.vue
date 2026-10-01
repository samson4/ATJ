<script setup lang="ts">
withDefaults(defineProps<{ index: number; total: number; label: string; removable?: boolean }>(), {
  removable: true
})
defineEmits<{ move: [direction: -1 | 1]; remove: [] }>()
</script>

<template>
  <div class="flex items-center gap-1">
    <UButton
      icon="i-lucide-chevron-up"
      color="neutral"
      variant="ghost"
      size="xs"
      :disabled="index === 0"
      :aria-label="`Move ${label} up`"
      @click="$emit('move', -1)"
    />
    <UButton
      icon="i-lucide-chevron-down"
      color="neutral"
      variant="ghost"
      size="xs"
      :disabled="index === total - 1"
      :aria-label="`Move ${label} down`"
      @click="$emit('move', 1)"
    />
    <UButton
      v-if="removable"
      icon="i-lucide-trash-2"
      color="error"
      variant="ghost"
      size="xs"
      :aria-label="`Remove ${label}`"
      @click="$emit('remove')"
    />
  </div>
</template>
