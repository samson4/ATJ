<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { ResumeDocument, ResumeTemplateKey } from '~~/shared/types/resume'

const props = defineProps<{ document: ResumeDocument, templateKey: ResumeTemplateKey }>()

const previewUrl = ref('')
const mobilePageImages = ref<string[]>([])
const loading = ref(true)
const refreshing = ref(false)
const errorMessage = ref('')
const isMobileView = ref(false)
let controller: AbortController | null = null
let mobileMediaQuery: MediaQueryList | null = null

function syncMobileView() {
  isMobileView.value = mobileMediaQuery?.matches ?? false
}

async function renderMobilePages(blob: Blob, request: AbortController) {
  const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ])
  GlobalWorkerOptions.workerSrc = workerModule.default

  const task = getDocument({ data: new Uint8Array(await blob.arrayBuffer()) })
  const pdf = await task.promise
  const pages: string[] = []

  try {
    const availableWidth = Math.min(Math.max(window.innerWidth - 40, 280), 794)
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (request !== controller || request.signal.aborted) return null

      const page = await pdf.getPage(pageNumber)
      const initialViewport = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: (availableWidth * pixelRatio) / initialViewport.width })
      const canvas = window.document.createElement('canvas')
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('Your browser could not draw this preview.')

      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, canvasContext: context, viewport }).promise
      pages.push(canvas.toDataURL('image/webp', 0.9))
      page.cleanup()
    }

    return pages
  } finally {
    await pdf.destroy()
  }
}

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
      body: JSON.stringify({ document: props.document, templateKey: props.templateKey }),
      signal: request.signal
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.statusMessage || body?.message || 'Could not generate the preview.')
    }

    const blob = await response.blob()
    const nextUrl = URL.createObjectURL(blob)
    const nextMobilePages = isMobileView.value
      ? await renderMobilePages(blob, request)
      : []
    if (request !== controller) {
      URL.revokeObjectURL(nextUrl)
      return
    }
    if (nextMobilePages === null) {
      URL.revokeObjectURL(nextUrl)
      return
    }
    const previousUrl = previewUrl.value
    previewUrl.value = nextUrl
    mobilePageImages.value = nextMobilePages
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
  () => [props.document, props.templateKey],
  () => void generatePreview(),
  { deep: true, debounce: 700, maxWait: 2000, immediate: true }
)

watch(isMobileView, (mobile, previous) => {
  if (mobile && !previous && previewUrl.value && !mobilePageImages.value.length) void generatePreview()
})

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 1279px)')
  syncMobileView()
  mobileMediaQuery.addEventListener('change', syncMobileView)
})

onBeforeUnmount(() => {
  controller?.abort()
  mobileMediaQuery?.removeEventListener('change', syncMobileView)
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

    <div v-if="previewUrl && mobilePageImages.length" class="space-y-3 xl:hidden">
      <img
        v-for="(page, index) in mobilePageImages"
        :key="`${previewUrl}-${index}`"
        :src="page"
        :alt="`Resume preview page ${index + 1} of ${mobilePageImages.length}`"
        class="h-auto w-full rounded-sm bg-white shadow-sm"
      >
    </div>

    <iframe
      v-if="previewUrl"
      :src="`${previewUrl}#toolbar=0&navpanes=0&view=FitH`"
      title="Generated resume PDF"
      class="hidden h-[calc(100vh-4rem)] min-h-[720px] w-full rounded-lg border-0 bg-default xl:block"
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
