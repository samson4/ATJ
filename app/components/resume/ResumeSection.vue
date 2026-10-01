<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  defaultOpen?: boolean
  sortable?: boolean
}>(), {
  description: '',
  defaultOpen: true,
  sortable: false
})
</script>

<template>
  <UCollapsible :default-open="defaultOpen" class="rounded-lg border border-muted bg-default">
    <template #default="{ open }">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 p-4 text-left"
        :aria-label="`${open ? 'Collapse' : 'Expand'} ${title}`"
      >
        <span class="flex min-w-0 items-center gap-3">
          <span
            v-if="sortable"
            class="resume-section-drag-handle inline-flex shrink-0 cursor-grab touch-none items-center text-muted active:cursor-grabbing"
            aria-label="Drag to rearrange section"
            title="Drag to rearrange section"
            @click.stop
          >
            <UIcon name="i-lucide-grip-vertical" class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block font-semibold text-highlighted">{{ title }}</span>
            <span v-if="description" class="mt-0.5 block text-sm font-normal text-muted">{{ description }}</span>
          </span>
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 text-muted transition-transform duration-200"
          :class="open && 'rotate-180'"
        />
      </button>
    </template>

    <template #content>
      <div class="space-y-4 border-t border-muted p-4">
        <div v-if="$slots.actions" class="flex justify-end">
          <slot name="actions" />
        </div>
        <slot />
      </div>
    </template>
  </UCollapsible>
</template>
