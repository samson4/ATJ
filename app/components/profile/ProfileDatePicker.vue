<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue
} from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  allowPresent?: boolean
  output?: 'date' | 'year'
}>(), {
  placeholder: 'Select date',
  allowPresent: false,
  output: 'date'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const timeZone = getLocalTimeZone()
const formatter = new DateFormatter('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const selectedDate = computed<DateValue | undefined>({
  get: () => parseProfileDate(props.modelValue),
  set: (value) => {
    emit('update:modelValue', formatSelectedDate(value))
    open.value = false
  }
})

const calendarDefaultValue = computed(() => selectedDate.value || today(timeZone))
const hasValue = computed(() => props.modelValue.trim().length > 0)

function parseProfileDate(value?: string) {
  const trimmed = value?.trim()

  if (!trimmed || trimmed.toLowerCase() === 'present') return undefined

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return parseDate(trimmed)
    }

    if (/^\d{4}$/.test(trimmed)) {
      return parseDate(`${trimmed}-01-01`)
    }

    const parsedDate = new Date(trimmed)

    if (!Number.isNaN(parsedDate.getTime())) {
      return parseDate(toDateString(parsedDate))
    }
  } catch {
    return undefined
  }

  return undefined
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatSelectedDate(value?: DateValue) {
  if (!value) return ''

  if (props.output === 'year') {
    return String(value.year)
  }

  return formatter.format(value.toDate(timeZone))
}

function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}

function setPresent() {
  emit('update:modelValue', 'Present')
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ side: 'bottom', align: 'start' }">
    <UButton
      block
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-calendar-days"
      class="justify-between font-normal"
    >
      <span :class="hasValue ? 'text-default' : 'text-dimmed'">
        {{ hasValue ? modelValue : placeholder }}
      </span>
    </UButton>

    <template #content>
      <div class="p-2">
        <UCalendar
          v-model="selectedDate"
          :default-value="calendarDefaultValue"
        />
      </div>

      <div class="flex items-center justify-between gap-2 border-t border-muted p-2">
        <UButton
          v-if="allowPresent"
          label="Present"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="setPresent"
        />
        <span v-else />

        <UButton
          label="Clear"
          color="error"
          variant="ghost"
          size="xs"
          @click="clearDate"
        />
      </div>
    </template>
  </UPopover>
</template>
