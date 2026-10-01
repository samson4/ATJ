<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { ResumeDocument } from '~~/shared/types/resume'

const props = defineProps<{ document: ResumeDocument }>()

const previewUrl = ref('')
const loading = ref(true)
const refreshing = ref(false)
const errorMessage = ref('')
let controller: AbortController | null = null

async function generatePreview() {
  controller?.abort()
  controller = new AbortController()
  const request = controller
  errorMessage.value = ''
  if (previewUrl.value) refreshing.value = true
  else loading.value = true

  try {
    const { $supabase } = useNuxtApp()
    const { data: { session } } = await $supabase.auth.getSession()
    if (!session?.access_token) throw new Error('You need to sign in again.')

    const response = await fetch('/api/resumes/preview', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(props.document),
      signal: request.signal
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.statusMessage || body?.message || 'Could not generate the preview.')
    }

    const nextUrl = URL.createObjectURL(await response.blob())
    if (request !== controller) {
      URL.revokeObjectURL(nextUrl)
      return
    }
    const previousUrl = previewUrl.value
    previewUrl.value = nextUrl
    if (previousUrl) URL.revokeObjectURL(previousUrl)
  } catch (error: any) {
    if (error?.name !== 'AbortError') errorMessage.value = error?.message || 'Could not generate the preview.'
  } finally {
    if (request === controller) {
      loading.value = false
      refreshing.value = false
    }
  }
}

watchDebounced(
  () => props.document,
  () => void generatePreview(),
  { deep: true, debounce: 700, maxWait: 2000, immediate: true }
)

onBeforeUnmount(() => {
  controller?.abort()
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="relative min-h-[720px] w-full" aria-label="PDF resume preview">
    <USkeleton v-if="loading && !previewUrl" class="h-[calc(100vh-4rem)] min-h-[720px] w-full" />

    <UAlert
      v-else-if="errorMessage && !previewUrl"
      color="error"
      icon="i-lucide-file-warning"
      title="Preview unavailable"
      :description="errorMessage"
      :actions="[{ label: 'Try again', color: 'error', variant: 'outline', onClick: generatePreview }]"
    />

    <iframe
      v-if="previewUrl"
      :src="`${previewUrl}#toolbar=0&navpanes=0&view=FitH`"
      title="Generated resume PDF"
      class="h-[calc(100vh-4rem)] min-h-[720px] w-full rounded-lg border-0 bg-default"
    />

    <div v-if="refreshing" class="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <UBadge color="neutral" variant="solid" icon="i-lucide-loader-circle" label="Updating preview" class="shadow-md" />
    </div>

    <UAlert
      v-if="errorMessage && previewUrl"
      class="absolute inset-x-3 bottom-3"
      color="error"
      variant="solid"
      icon="i-lucide-triangle-alert"
      title="Preview update failed"
      :description="errorMessage"
    />
  </div>
</template>
