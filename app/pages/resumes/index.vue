<script setup lang="ts">
import type { ResumeCreationSource, ResumeDocument, ResumeRow, ResumeTemplateKey } from '~~/shared/types/resume'
import { resumeTemplateByKey } from '~~/shared/data/resumeTemplates'
import { useResumeStore } from '~/stores/resume'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Resume Builder | Addis Tech Jobs', robots: 'noindex, nofollow' })

const store = useResumeStore()
const toast = useToast()
const router = useRouter()
const createOpen = ref(false)
const cvUploadOpen = ref(false)
const renameOpen = ref(false)
const deleteOpen = ref(false)
const creating = ref(false)
const cvUploadStage = ref<'idle' | 'uploading' | 'parsing'>('idle')
const selectedCvFile = ref<File | null>(null)
const cvUploadError = ref('')
const selectedCvUploaded = ref(false)
const selectedCvSourcePath = ref<string | null>(null)
const workingId = ref('')
const selected = ref<ResumeRow | null>(null)
const newName = ref('Targeted Resume')
const renameValue = ref('')
const creationSource = ref<ResumeCreationSource>('blank')
const templateKey = ref<ResumeTemplateKey>('ats-classic')
const creationPreviewDocument = ref<ResumeDocument>()
const creationPreviewLoading = ref(false)
const creationPreviewError = ref('')
const cvUploadRequired = ref(false)
const preparedCreation = ref<{
  source: ResumeCreationSource
  document: ResumeDocument
  sourceCvPath: string | null
}>()
let preparationGeneration = 0

const uploadingCv = computed(() => cvUploadStage.value !== 'idle')
const cvUploadButtonLabel = computed(() => {
  if (cvUploadStage.value === 'uploading') return 'Uploading CV…'
  if (cvUploadStage.value === 'parsing') return 'Reading CV…'
  if (selectedCvUploaded.value) return 'Try reading again'
  return 'Upload and continue'
})

const creationOptions = [
  { label: 'Blank resume', value: 'blank', description: 'Start with empty sections.' },
  { label: 'From profile', value: 'profile', description: 'Copy your profile details into a new independent draft.' },
  { label: 'Import uploaded CV', value: 'cv', description: 'Extract editable content from the PDF saved in your profile.' },
]

onMounted(() => store.fetchResumes())

async function prepareCreationSource(
  source: ResumeCreationSource,
  file?: File,
  sourceCvPath: string | null = null
): Promise<boolean> {
  const activeGeneration = ++preparationGeneration
  creationPreviewLoading.value = true
  creationPreviewError.value = ''
  cvUploadRequired.value = false
  creationPreviewDocument.value = undefined
  preparedCreation.value = undefined
  try {
    const resolved = file
      ? await store.prepareResumeSourceFromFile(file, sourceCvPath)
      : await store.prepareResumeSource(source)
    if (activeGeneration !== preparationGeneration) return false
    if (resolved.status === 'cv-required') {
      creationPreviewError.value = resolved.warning
      cvUploadRequired.value = true
      cvUploadError.value = ''
      selectedCvFile.value = null
      cvUploadOpen.value = true
      return false
    }
    creationPreviewDocument.value = resolved.document
    preparedCreation.value = { source, ...resolved }
    return true
  } catch (error: any) {
    if (activeGeneration !== preparationGeneration) return false
    creationPreviewError.value = error.data?.statusMessage || error.message || 'Could not prepare a template preview.'
    return false
  } finally {
    if (activeGeneration === preparationGeneration) creationPreviewLoading.value = false
  }
}

watch([createOpen, creationSource], ([open, source]) => {
  if (!open) {
    preparationGeneration++
    cvUploadOpen.value = false
    selectedCvFile.value = null
    cvUploadError.value = ''
    selectedCvUploaded.value = false
    selectedCvSourcePath.value = null
    cvUploadStage.value = 'idle'
    return
  }

  if (source !== 'cv') {
    cvUploadOpen.value = false
    selectedCvFile.value = null
    cvUploadError.value = ''
  }
  void prepareCreationSource(source)
})

watch(selectedCvFile, () => {
  cvUploadError.value = ''
  selectedCvUploaded.value = false
  selectedCvSourcePath.value = null
})

function openCvUpload() {
  selectedCvFile.value = null
  cvUploadError.value = ''
  selectedCvUploaded.value = false
  selectedCvSourcePath.value = null
  cvUploadOpen.value = true
}

function cancelCvUpload() {
  selectedCvFile.value = null
  cvUploadError.value = ''
  selectedCvUploaded.value = false
  selectedCvSourcePath.value = null
  cvUploadOpen.value = false
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadCvAndContinue() {
  if (!selectedCvFile.value) {
    cvUploadError.value = 'Choose a PDF CV to continue.'
    return
  }

  const file = selectedCvFile.value
  cvUploadError.value = ''
  try {
    if (!selectedCvUploaded.value) {
      cvUploadStage.value = 'uploading'
      const profileCv = await store.uploadProfileCv(file)
      selectedCvUploaded.value = true
      selectedCvSourcePath.value = profileCv.uploaded ? profileCv.path : null
    }
    cvUploadStage.value = 'parsing'
    const imported = await prepareCreationSource('cv', file, selectedCvSourcePath.value)
    if (!imported) {
      cvUploadOpen.value = true
      cvUploadError.value = creationPreviewError.value || 'The CV contents could not be read.'
      return
    }

    cvUploadOpen.value = false
    selectedCvFile.value = null
    selectedCvUploaded.value = false
    selectedCvSourcePath.value = null
    toast.add({ title: 'CV ready', description: 'Your PDF content is ready to review.', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (error: any) {
    cvUploadError.value = error.data?.statusMessage || error.message || 'Could not upload your CV.'
  } finally {
    cvUploadStage.value = 'idle'
  }
}

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function createDraft() {
  if (creationPreviewLoading.value) return
  creating.value = true
  try {
    const prepared = preparedCreation.value?.source === creationSource.value
      ? { document: preparedCreation.value.document, sourceCvPath: preparedCreation.value.sourceCvPath }
      : undefined
    const resume = await store.createResume(newName.value, creationSource.value, templateKey.value, prepared)
    createOpen.value = false
    await router.push(`/resumes/${resume.id}`)
  } catch (error: any) {
    toast.add({ title: 'Could not create resume', description: error.data?.statusMessage || error.message, color: 'error', icon: 'i-lucide-triangle-alert' })
  } finally {
    creating.value = false
  }
}

function openRename(resume: ResumeRow) {
  selected.value = resume
  renameValue.value = resume.name
  renameOpen.value = true
}

async function renameDraft() {
  if (!selected.value) return
  workingId.value = selected.value.id
  try {
    await store.renameResume(selected.value.id, renameValue.value)
    renameOpen.value = false
    toast.add({ title: 'Resume renamed', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (error: any) {
    toast.add({ title: 'Could not rename resume', description: error.message, color: 'error' })
  } finally { workingId.value = '' }
}

// async function duplicateDraft(resume: ResumeRow) {
//   workingId.value = resume.id
//   try {
//     await store.duplicateResume(resume)
//     toast.add({ title: 'Resume duplicated', color: 'success', icon: 'i-lucide-copy-check' })
//   } catch (error: any) {
//     toast.add({ title: 'Could not duplicate resume', description: error.message, color: 'error' })
//   } finally { workingId.value = '' }
// }

function openDelete(resume: ResumeRow) {
  selected.value = resume
  deleteOpen.value = true
}

async function deleteDraft() {
  if (!selected.value) return
  workingId.value = selected.value.id
  try {
    await store.deleteResume(selected.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Resume deleted', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (error: any) {
    toast.add({ title: 'Could not delete resume', description: error.message, color: 'error' })
  } finally { workingId.value = '' }
}

// async function downloadDraft(resume: ResumeRow) {
//   workingId.value = resume.id
//   try { await store.downloadResume(resume) }
//   catch (error: any) { toast.add({ title: 'Could not download PDF', description: error.message, color: 'error' }) }
//   finally { workingId.value = '' }
// }
</script>

<template>
  <UContainer class="py-8">
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold text-highlighted">Resume Builder</h1>
      <p class="text-muted">Create targeted, ATS-friendly resumes without changing your candidate profile.</p>
    </div>
    <div class="mx-auto max-w-6xl space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-highlighted">Your resumes</h2>
          <p class="text-sm text-muted">Each draft is private and saved independently.</p>
        </div>
        <UButton label="New resume" icon="i-lucide-plus" @click="createOpen = true" />
      </div>

      <UAlert v-if="store.errorMessage" color="error" icon="i-lucide-triangle-alert" :title="store.errorMessage" />
      <div v-if="store.loading" class="grid gap-4 md:grid-cols-2">
        <USkeleton v-for="item in 4" :key="item" class="h-44" />
      </div>
      <UCard v-else-if="!store.resumes.length">
        <div class="py-10 text-center">
          <UIcon name="i-lucide-file-plus-2" class="mx-auto size-11 text-muted" />
          <h3 class="mt-3 font-semibold text-highlighted">Create your first targeted resume</h3>
          <p class="mx-auto mt-1 max-w-md text-sm text-muted">Start from your profile, import your uploaded CV, or begin
            with a clean page.</p>
          <UButton class="mt-5" label="Create resume" icon="i-lucide-plus" @click="createOpen = true" />
        </div>
      </UCard>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <UCard  v-for="resume in store.resumes" :key="resume.id" class="border border-2 border-transparent hover:border-primary transition duration-200">
          <NuxtLink :to="`/resumes/${resume.id}`"  class="">
          <div class="flex h-full flex-col gap-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-semibold text-highlighted">{{ resume.name }}</h3>
                <p class="mt-1 text-xs text-muted">Updated {{ formatUpdated(resume.updated_at) }}</p>
              </div>
              <UBadge :label="resumeTemplateByKey[resume.template_key].name" color="neutral" variant="subtle" />
            </div>
            <p class="line-clamp-2 text-sm text-muted">{{ resume.content.basics.headline ||
              resume.content.basics.summary || 'Add your details and tailor this resume for a role.' }}</p>
            <div class="mt-auto flex flex-wrap gap-2 justify-end">
              <UButton icon="i-lucide-text-cursor-input" size="sm" color="neutral" label="Rename"
                @click.prevent="openRename(resume)" />
              <UButton icon="i-lucide-trash-2" size="sm" color="error" label="Delete" @click.prevent="openDelete(resume)" />
            </div>
          </div>
        </NuxtLink>
        </UCard>
      </div>
    </div>

    <UModal v-model:open="createOpen" title="Create a resume" description="Choose how you want to start."
      :ui="{ content: 'max-w-4xl' }">
      <template #body>
        <div class="space-y-6">
          <UFormField label="Resume name">
            <UInput v-model="newName" maxlength="120" class="w-full" />
          </UFormField>
          <URadioGroup v-model="creationSource" :items="creationOptions" />
          <div v-if="creationPreviewError && !cvUploadOpen" class="space-y-3">
            <UAlert :color="cvUploadRequired ? 'warning' : 'error'" icon="i-lucide-file-warning"
              :title="cvUploadRequired ? 'CV upload required' : 'Preview unavailable'"
              :description="creationPreviewError" />
            <UButton v-if="cvUploadRequired" label="Choose a PDF" icon="i-lucide-file-up" color="warning"
              variant="outline" @click="openCvUpload" />
          </div>

          <div
            v-if="creationSource === 'cv' && preparedCreation?.source === 'cv' && !cvUploadOpen && !creationPreviewLoading"
            class="flex flex-col gap-3 rounded-lg border border-default p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-medium text-highlighted">CV imported</p>
              <p class="text-sm text-muted">Review the preview below or choose a different PDF.</p>
            </div>
            <UButton label="Choose a different PDF" icon="i-lucide-refresh-cw" color="neutral" variant="outline"
              @click="openCvUpload" />
          </div>

          <div v-if="creationSource === 'cv' && cvUploadOpen" class="space-y-4">
            <UFileUpload v-model="selectedCvFile" accept="application/pdf,.pdf" label="Choose a PDF CV"
              description="Select the correct file, review it, then upload. PDF only, up to 10 MB."
              icon="i-lucide-cloud-upload" :preview="false" :disabled="uploadingCv" class="w-full" />
            <div v-if="selectedCvFile"
              class="flex flex-col gap-3 rounded-lg border border-default bg-elevated p-3 sm:flex-row sm:items-center">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <UIcon name="i-lucide-file-text" class="size-8 shrink-0 text-primary" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted" :title="selectedCvFile.name">
                    {{ selectedCvFile.name }}
                  </p>
                  <p class="text-xs text-muted">PDF · {{ formatFileSize(selectedCvFile.size) }}</p>
                </div>
              </div>
              <div class="flex shrink-0 flex-wrap justify-end gap-2">
                <UFileUpload v-model="selectedCvFile" accept="application/pdf,.pdf" variant="button"
                  label="Change" icon="i-lucide-refresh-cw" size="sm" color="neutral" :preview="false"
                  :disabled="uploadingCv" />
                <UButton label="Remove" icon="i-lucide-trash-2" size="sm" color="error" variant="outline"
                  :disabled="uploadingCv" @click="selectedCvFile = null" />
              </div>
            </div>
            <UAlert v-if="cvUploadError" color="error" icon="i-lucide-triangle-alert" title="Could not import CV"
              :description="cvUploadError" />
            <div class="flex w-full flex-wrap justify-end gap-2">
              <UButton label="Cancel" color="neutral" variant="outline" :disabled="uploadingCv"
                @click="cancelCvUpload" />
              <UButton :label="cvUploadButtonLabel" icon="i-lucide-upload" :loading="uploadingCv"
                :disabled="!selectedCvFile || uploadingCv" @click="uploadCvAndContinue" />
            </div>
          </div>

          <ResumeTemplatePicker v-model="templateKey" :document="creationPreviewDocument"
            :loading="creationPreviewLoading" />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="createOpen = false" />
          <UButton label="Create resume" :loading="creating"
            :disabled="creationPreviewLoading || !preparedCreation || cvUploadOpen"
            @click="createDraft" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="renameOpen" title="Rename resume">
      <template #body>
        <UFormField label="Resume name">
          <UInput v-model="renameValue" maxlength="120" class="w-full" @keyup.enter="renameDraft" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="renameOpen = false" />
          <UButton label="Rename" :loading="workingId === selected?.id" @click="renameDraft" />
        </div>
      </template>
    </UModal>
    <UModal v-model:open="deleteOpen" title="Delete resume" description="This cannot be undone.">
      <template #body>
        <p class="text-sm text-muted">Delete “{{ selected?.name }}” permanently?</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="deleteOpen = false" />
          <UButton label="Delete" color="error" :loading="workingId === selected?.id" @click="deleteDraft" />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
