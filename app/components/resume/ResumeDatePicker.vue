<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import { formatResumeDate } from '~~/shared/utils/resume'

withDefaults(defineProps<{
  placeholder?: string
}>(), {
  placeholder: 'Select month'
})

const model = defineModel<string>({ required: true })
const open = ref(false)

const selectedDate = computed<DateValue | undefined>(() => {
  const match = model.value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return undefined
  return new CalendarDate(year, month, 1)
})

const label = computed(() => formatResumeDate(model.value) || undefined)

function selectDate(value: DateValue | undefined) {
  if (!value) return
  model.value = `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}`
  open.value = false
}
</script>

<template>
  <div class="flex w-full items-center gap-1">
    <UPopover v-model:open="open">
      <UButton
        :label="label || placeholder"
        icon="i-lucide-calendar-days"
        color="neutral"
        variant="outline"
        class="min-w-0 flex-1 justify-start"
        :class="!label && 'text-muted'"
      />

      <template #content>
        <UCalendar
          :model-value="selectedDate"
          type="month"
          class="p-3"
          @update:model-value="selectDate"
        />
      </template>
    </UPopover>

    <UButton
      v-if="model"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      aria-label="Clear date"
      @click="model = ''"
    />
  </div>
</template>
