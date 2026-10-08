<script setup lang="ts">
import { resumeDocumentSchema } from '~~/shared/schemas/resume'
import { resumeAtsCategoryDefinitions } from '~~/shared/data/resumeAts'
import { resumeTemplateByKey } from '~~/shared/data/resumeTemplates'
import type { ResumeAtsScoreResponse, ResumeDocument, ResumeTemplateKey } from '~~/shared/types/resume'
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
const templateOpen = ref(false)
const pendingTemplateKey = ref<ResumeTemplateKey>('ats-classic')
const templatePreviewDocument = ref<ResumeDocument>()
const atsOpen = ref(false)
const atsLoading = ref(false)
const atsLoadingMessage = ref('Loading latest ATS score…')
const atsError = ref('')
const atsResult = ref<ResumeAtsScoreResponse>()
const atsScoredSnapshot = ref('')
const copiedSuggestedFix = ref('')
let copiedSuggestedFixTimer: ReturnType<typeof setTimeout> | null = null
const editableSnapshot = computed(() => store.currentResume
  ? JSON.stringify({ name: store.currentResume.name, template_key: store.currentResume.template_key, content: store.currentResume.content })
  : '')
const templateName = computed(() => store.currentResume
  ? resumeTemplateByKey[store.currentResume.template_key].name
  : '')
const atsContentSnapshot = computed(() => JSON.stringify(store.currentResume?.content ?? null))
const atsOutdated = computed(() => Boolean(atsResult.value && (
  atsResult.value.outdated || atsScoredSnapshot.value !== atsContentSnapshot.value
)))
const atsColor = computed(() => {
  const score = atsResult.value?.score ?? 0
  return score >= 80 ? 'success' as const : score >= 60 ? 'warning' as const : 'error' as const
})
const atsCategories = computed(() => atsResult.value
  ? Object.entries(resumeAtsCategoryDefinitions).map(([key, definition]) => ({
      key,
      ...definition,
      ...atsResult.value!.categories[key as keyof ResumeAtsScoreResponse['categories']]
    }))
  : [])

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

watch(editableSnapshot, (current, previous) => {
  if (editorReady.value && current !== previous) store.scheduleSave()
})

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
  if (copiedSuggestedFixTimer) clearTimeout(copiedSuggestedFixTimer)
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

async function saveNow() {
  try { await store.flushSave() }
  catch (error: any) { toast.add({ title: 'Save failed', description: error.data?.statusMessage || error.message, color: 'error' }) }
}

function openTemplatePicker() {
  if (!store.currentResume) return
  pendingTemplateKey.value = store.currentResume.template_key
  templatePreviewDocument.value = JSON.parse(JSON.stringify(store.currentResume.content))
  templateOpen.value = true
}

function applyTemplate() {
  if (!store.currentResume) return
  store.currentResume.template_key = pendingTemplateKey.value
  templateOpen.value = false
}

async function openAtsScore() {
  if (!store.currentResume) return
  atsOpen.value = true
  if (atsResult.value) return
  atsLoading.value = true
  atsLoadingMessage.value = 'Loading latest ATS score…'
  atsError.value = ''
  try {
    await store.flushSave()
    const latest = await store.fetchLatestAtsScore(store.currentResume.id)
    if (latest) {
      atsResult.value = latest
      atsScoredSnapshot.value = latest.outdated ? '' : atsContentSnapshot.value
    } else {
      atsLoadingMessage.value = 'Analyzing resume…'
      atsResult.value = await store.assessResume(store.currentResume.id, true)
      atsScoredSnapshot.value = atsContentSnapshot.value
    }
  } catch (error: any) {
    atsError.value = error.data?.statusMessage || error.message || 'Could not load the latest ATS score.'
  } finally {
    atsLoading.value = false
  }
}

async function runAtsScore() {
  if (!store.currentResume) return
  atsLoading.value = true
  atsLoadingMessage.value = 'Analyzing resume…'
  atsError.value = ''
  try {
    await store.flushSave()
    atsResult.value = await store.assessResume(store.currentResume.id, true)
    atsScoredSnapshot.value = atsContentSnapshot.value
  } catch (error: any) {
    atsError.value = error.data?.statusMessage || error.message || 'Could not assess this resume.'
  } finally {
    atsLoading.value = false
  }
}

async function copySuggestedFix(key: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedSuggestedFix.value = key
    if (copiedSuggestedFixTimer) clearTimeout(copiedSuggestedFixTimer)
    copiedSuggestedFixTimer = setTimeout(() => {
      copiedSuggestedFix.value = ''
      copiedSuggestedFixTimer = null
    }, 2000)
  } catch {
    toast.add({ title: 'Could not copy suggested fix', color: 'error' })
  }
}
</script>

<template>
  <div class="min-h-screen px-3 py-4 sm:px-5 lg:px-6">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Back to resumes" @click="router.push('/resumes')" />
          <div class="min-w-0"><UInput v-if="store.currentResume" v-model="store.currentResume.name" maxlength="120" variant="none" class="w-full text-lg font-semibold" aria-label="Resume name" /><div class="flex items-center gap-1"><p class="text-xs text-muted">{{ templateName }} template</p></div></div>
        </div>
        <UButton label="Templates" size="md" icon="i-lucide-layout-template" color="primary" variant="subtle" class="px-3" @click="openTemplatePicker" />

        <div class="flex flex-wrap items-center gap-2">
          <UBadge v-if="store.currentResume" :label="statusPresentation.label" :color="statusPresentation.color" variant="subtle" :icon="statusPresentation.icon" />
          <UButton v-if="store.saveStatus === 'error'" label="Retry save" icon="i-lucide-refresh-cw" color="error" variant="outline" @click="retrySave" />
          <!-- <UButton label="Save" icon="i-lucide-save" color="neutral" variant="outline" :loading="store.saveStatus === 'saving'" :disabled="!store.currentResume || store.saveStatus === 'saved'" @click="saveNow" /> -->
          <UButton label="ATS Score" icon="i-lucide-gauge" color="neutral" variant="outline" :loading="atsLoading" :disabled="!store.currentResume" @click="openAtsScore()" />
          <UButton label="Download PDF" icon="i-lucide-download" :loading="downloading" :disabled="!store.currentResume" @click="download" />
        </div>
      </div>

      <UAlert v-if="store.errorMessage" class="mb-5" color="error" icon="i-lucide-triangle-alert" :title="store.saveStatus === 'error' ? 'Could not save resume' : store.errorMessage" :description="store.saveStatus === 'error' ? store.errorMessage : undefined" />
      <UAlert v-if="store.importWarnings.length" class="mb-5" color="warning" icon="i-lucide-scan-text" title="Review imported CV content" :description="store.importWarnings.join(' ')" />
      <div v-if="store.loading" class="grid gap-5 xl:grid-cols-[minmax(400px,0.75fr)_minmax(650px,1.25fr)]"><USkeleton class="h-[70vh]" /><USkeleton class="h-[70vh]" /></div>
      <UCard v-else-if="!store.currentResume"><div class="py-10 text-center"><h2 class="font-semibold text-highlighted">Resume unavailable</h2><p class="mt-1 text-sm text-muted">It may have been deleted or you may not have access.</p><UButton to="/resumes" class="mt-5" label="Back to resumes" /></div></UCard>
      <template v-else>
        <div class="mb-4 flex rounded-lg bg-elevated p-1 xl:hidden"><UButton label="Edit" class="flex-1 justify-center" :variant="mobileView === 'edit' ? 'solid' : 'ghost'" @click="mobileView = 'edit'" /><UButton label="Preview" class="flex-1 justify-center" :variant="mobileView === 'preview' ? 'solid' : 'ghost'" @click="mobileView = 'preview'" /></div>
        <div class="grid items-start gap-6 xl:grid-cols-[minmax(400px,0.72fr)_minmax(650px,1.28fr)] 2xl:grid-cols-[minmax(460px,0.68fr)_minmax(794px,1.32fr)]">
          <UCard :class="mobileView === 'preview' ? 'hidden xl:block' : ''"><UForm :schema="resumeDocumentSchema" :state="store.currentResume.content"><ResumeEditor v-model="store.currentResume.content" /></UForm></UCard>
          <div :class="[mobileView === 'edit' ? 'hidden xl:block' : '', 'rounded-xl bg-elevated p-2 sm:p-4 xl:sticky xl:top-4']"><ResumePdfPreview :document="store.currentResume.content" :template-key="store.currentResume.template_key" /></div>
        </div>
      </template>

      <UModal v-model:open="templateOpen" title="Change template" description="Your resume content stays the same." :ui="{ content: 'max-w-4xl' }">
        <template #body><ResumeTemplatePicker v-model="pendingTemplateKey" :document="templatePreviewDocument" /></template>
        <template #footer><div class="flex w-full justify-end gap-2"><UButton label="Cancel" color="neutral" variant="outline" @click="templateOpen = false" /><UButton label="Apply template" icon="i-lucide-check" @click="applyTemplate" /></div></template>
      </UModal>

      <UModal v-model:open="atsOpen" title="ATS Readiness Score" description="A general content-readiness estimate, independent of your selected template." :ui="{ content: 'max-w-3xl' }">
        <template #body>
          <div v-if="atsLoading" class="py-12 text-center">
            <UIcon name="i-lucide-loader-circle" class="mx-auto size-8 animate-spin text-primary" />
            <p class="mt-3 text-sm text-muted">{{ atsLoadingMessage }}</p>
          </div>
          <div v-else-if="atsError && !atsResult" class="space-y-4">
            <UAlert color="error" icon="i-lucide-triangle-alert" title="Could not calculate ATS score" :description="atsError" />
            <div class="flex justify-end"><UButton label="Try again" icon="i-lucide-refresh-cw" @click="runAtsScore" /></div>
          </div>
          <div v-else-if="atsResult" class="space-y-6">
            <UAlert v-if="atsError" color="error" icon="i-lucide-triangle-alert" title="Could not update ATS score" :description="atsError" />
            <UAlert v-if="atsOutdated" color="warning" icon="i-lucide-refresh-cw" title="This score is out of date" description="Your resume content changed after this assessment." />
            <div class="rounded-xl bg-elevated p-5">
              <div class="flex items-end justify-between gap-4">
                <div><p class="text-sm text-muted">General readiness</p><p class="text-4xl font-bold text-highlighted">{{ atsResult.score }}<span class="text-lg font-medium text-muted">/100</span></p></div>
                <UBadge :color="atsColor" variant="subtle" :label="atsResult.score >= 80 ? 'Strong' : atsResult.score >= 60 ? 'Developing' : 'Needs work'" />
              </div>
              <UProgress class="mt-4" :model-value="atsResult.score" :color="atsColor" />
              <p class="mt-4 text-sm leading-6 text-muted">{{ atsResult.summary }}</p>
            </div>

            <div>
              <h3 class="mb-3 font-semibold text-highlighted">Score breakdown</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <div v-for="category in atsCategories" :key="category.key" class="rounded-lg border border-default p-4">
                  <div class="flex items-center justify-between gap-3"><p class="font-medium text-highlighted">{{ category.label }}</p><span class="text-sm font-semibold">{{ category.score }}/100</span></div>
                  <p class="mt-2 text-sm leading-5 text-muted">{{ category.feedback }}</p>
                </div>
              </div>
            </div>

            <div v-if="atsResult.strengths.length">
              <h3 class="mb-3 font-semibold text-highlighted">Strengths</h3>
              <div class="space-y-3"><div v-for="item in atsResult.strengths" :key="`${item.title}-${item.evidence}`" class="rounded-lg bg-success/5 p-4"><p class="font-medium text-highlighted">{{ item.title }}</p><p class="mt-1 text-sm text-muted">{{ item.detail }}</p><p v-if="item.evidence" class="mt-2 border-l-2 border-success pl-3 text-xs italic text-muted">“{{ item.evidence }}”</p></div></div>
            </div>

            <div v-if="atsResult.improvements.length">
              <h3 class="mb-3 font-semibold text-highlighted">Priority improvements</h3>
              <div class="space-y-3"><div v-for="item in atsResult.improvements" :key="`${item.title}-${item.evidence}`" class="rounded-lg bg-warning/5 p-4"><p class="font-medium text-highlighted">{{ item.title }}</p><p class="mt-1 text-sm text-muted">{{ item.detail }}</p><p v-if="item.evidence" class="mt-2 border-l-2 border-warning pl-3 text-xs italic text-muted">“{{ item.evidence }}”</p><div class="mt-3 rounded-md bg-default p-3"><div class="flex items-center justify-between gap-2"><p class="text-xs font-semibold uppercase tracking-wide text-muted">Suggested fix</p><UTooltip :open="copiedSuggestedFix === `${item.title}-${item.evidence}` ? true : undefined" :text="copiedSuggestedFix === `${item.title}-${item.evidence}` ? 'Copied' : 'Copy suggested fix'"><UButton :icon="copiedSuggestedFix === `${item.title}-${item.evidence}` ? 'i-lucide-check' : 'i-lucide-copy'" size="xs" :color="copiedSuggestedFix === `${item.title}-${item.evidence}` ? 'success' : 'neutral'" variant="ghost" :aria-label="copiedSuggestedFix === `${item.title}-${item.evidence}` ? 'Copied' : 'Copy suggested fix'" @click="copySuggestedFix(`${item.title}-${item.evidence}`, item.suggestedFix)" /></UTooltip></div><p class="mt-1 whitespace-pre-line text-sm leading-6 text-highlighted">{{ item.suggestedFix }}</p></div></div></div>
            </div>

            <p class="text-xs leading-5 text-muted">This is a general readiness estimate, not a job-match score or a guarantee from an employer’s ATS.</p>
          </div>
          <div v-else class="py-10 text-center"><UIcon name="i-lucide-gauge" class="mx-auto size-9 text-muted" /><h3 class="mt-3 font-semibold text-highlighted">No ATS score yet</h3><p class="mt-1 text-sm text-muted">Run the scorer when you are ready to assess this resume.</p></div>
        </template>
        <template v-if="!atsLoading" #footer>
          <div class="flex w-full justify-end gap-2"><UButton label="Close" color="neutral" variant="outline" @click="atsOpen = false" /><UButton :label="!atsResult ? 'Run ATS score' : atsOutdated ? 'Score updated resume' : 'Rerun score'" icon="i-lucide-refresh-cw" @click="runAtsScore" /></div>
        </template>
      </UModal>
  </div>
</template>
