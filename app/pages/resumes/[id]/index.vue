<script setup lang="ts">
import { resumeDocumentSchema } from '~~/shared/schemas/resume'
import { useResumeStore } from '~/stores/resume'

definePageMeta({ layout: 'resume', middleware: 'auth' })
useSeoMeta({ title: 'Edit Resume | Addis Tech Jobs', robots: 'noindex, nofollow' })

const route = useRoute()
const router = useRouter()
const store = useResumeStore()
const toast = useToast()
const mobileView = ref<'edit' | 'preview'>('edit')
const editorReady = ref(false)
const downloading = ref(false)

const statusPresentation = computed(() => ({
  idle: { label: 'Not saved', color: 'neutral' as const, icon: 'i-lucide-circle' },
  dirty: { label: 'Unsaved', color: 'warning' as const, icon: 'i-lucide-circle-dot' },
  saving: { label: 'Saving', color: 'primary' as const, icon: 'i-lucide-loader-circle' },
  saved: { label: 'Saved', color: 'success' as const, icon: 'i-lucide-cloud-check' },
  error: { label: 'Save failed', color: 'error' as const, icon: 'i-lucide-cloud-alert' }
}[store.saveStatus]))

onMounted(async () => {
  const resume = await store.fetchResume(String(route.params.id))
  if (!resume) return
  await nextTick()
  editorReady.value = true
  window.addEventListener('beforeunload', beforeUnload)
})

watch(() => store.currentResume && ({ name: store.currentResume.name, content: store.currentResume.content }), () => {
  if (editorReady.value) store.scheduleSave()
}, { deep: true })

function beforeUnload(event: BeforeUnloadEvent) {
  if (!['dirty', 'saving', 'error'].includes(store.saveStatus)) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(async () => {
  if (!editorReady.value) return true
  try { await store.flushSave(); return true }
  catch { return window.confirm('Your latest changes could not be saved. Leave this page anyway?') }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  store.clearCurrent()
})

async function download() {
  if (!store.currentResume) return
  downloading.value = true
  try { await store.downloadResume(store.currentResume) }
  catch (error: any) { toast.add({ title: 'Could not download PDF', description: error.message, color: 'error' }) }
  finally { downloading.value = false }
}

async function retrySave() {
  try { await store.flushSave() }
  catch (error: any) { toast.add({ title: 'Save failed', description: error.message, color: 'error' }) }
}
</script>

<template>
  <div class="min-h-screen px-3 py-4 sm:px-5 lg:px-6">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Back to resumes" @click="router.push('/resumes')" />
          <div class="min-w-0"><UInput v-if="store.currentResume" v-model="store.currentResume.name" maxlength="120" variant="none" class="w-full text-lg font-semibold" aria-label="Resume name" /><p class="text-xs text-muted">ATS Classic template</p></div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge v-if="store.currentResume" :label="statusPresentation.label" :color="statusPresentation.color" variant="subtle" :icon="statusPresentation.icon" />
          <UButton v-if="store.saveStatus === 'error'" label="Retry save" icon="i-lucide-refresh-cw" color="error" variant="outline" @click="retrySave" />
          <UButton label="Download PDF" icon="i-lucide-download" :loading="downloading" :disabled="!store.currentResume" @click="download" />
        </div>
      </div>

      <UAlert v-if="store.errorMessage && store.saveStatus !== 'error'" class="mb-5" color="error" icon="i-lucide-triangle-alert" :title="store.errorMessage" />
      <UAlert v-if="store.importWarnings.length" class="mb-5" color="warning" icon="i-lucide-scan-text" title="Review imported CV content" :description="store.importWarnings.join(' ')" />
      <div v-if="store.loading" class="grid gap-5 xl:grid-cols-[minmax(400px,0.75fr)_minmax(650px,1.25fr)]"><USkeleton class="h-[70vh]" /><USkeleton class="h-[70vh]" /></div>
      <UCard v-else-if="!store.currentResume"><div class="py-10 text-center"><h2 class="font-semibold text-highlighted">Resume unavailable</h2><p class="mt-1 text-sm text-muted">It may have been deleted or you may not have access.</p><UButton to="/resumes" class="mt-5" label="Back to resumes" /></div></UCard>
      <template v-else>
        <div class="mb-4 flex rounded-lg bg-elevated p-1 xl:hidden"><UButton label="Edit" class="flex-1 justify-center" :variant="mobileView === 'edit' ? 'solid' : 'ghost'" @click="mobileView = 'edit'" /><UButton label="Preview" class="flex-1 justify-center" :variant="mobileView === 'preview' ? 'solid' : 'ghost'" @click="mobileView = 'preview'" /></div>
        <div class="grid items-start gap-6 xl:grid-cols-[minmax(400px,0.72fr)_minmax(650px,1.28fr)] 2xl:grid-cols-[minmax(460px,0.68fr)_minmax(794px,1.32fr)]">
          <UCard :class="mobileView === 'preview' ? 'hidden xl:block' : ''"><UForm :schema="resumeDocumentSchema" :state="store.currentResume.content"><ResumeEditor v-model="store.currentResume.content" /></UForm></UCard>
          <div :class="[mobileView === 'edit' ? 'hidden xl:block' : '', 'rounded-xl bg-elevated p-2 sm:p-4 xl:sticky xl:top-4']"><ResumePdfPreview :document="store.currentResume.content" /></div>
        </div>
      </template>
  </div>
</template>
