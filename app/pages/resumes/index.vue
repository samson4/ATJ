<script setup lang="ts">
import type { ResumeCreationSource, ResumeRow } from '~~/shared/types/resume'
import { useResumeStore } from '~/stores/resume'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Resume Builder | Addis Tech Jobs', robots: 'noindex, nofollow' })

const store = useResumeStore()
const toast = useToast()
const router = useRouter()
const createOpen = ref(false)
const renameOpen = ref(false)
const deleteOpen = ref(false)
const creating = ref(false)
const workingId = ref('')
const selected = ref<ResumeRow | null>(null)
const newName = ref('Targeted Resume')
const renameValue = ref('')
const creationSource = ref<ResumeCreationSource>('profile')

const creationOptions = [
  { label: 'From profile', value: 'profile', description: 'Copy your profile details into a new independent draft.' },
  { label: 'Import uploaded CV', value: 'cv', description: 'Extract editable content from the PDF saved in your profile.' },
  { label: 'Blank resume', value: 'blank', description: 'Start with empty sections.' }
]

onMounted(() => store.fetchResumes())

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function createDraft() {
  creating.value = true
  try {
    const resume = await store.createResume(newName.value, creationSource.value)
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
        <div><h2 class="text-xl font-semibold text-highlighted">Your resumes</h2><p class="text-sm text-muted">Each draft is private and saved independently.</p></div>
        <UButton label="New resume" icon="i-lucide-plus" @click="createOpen = true" />
      </div>

      <UAlert v-if="store.errorMessage" color="error" icon="i-lucide-triangle-alert" :title="store.errorMessage" />
      <div v-if="store.loading" class="grid gap-4 md:grid-cols-2"><USkeleton v-for="item in 4" :key="item" class="h-44" /></div>
      <UCard v-else-if="!store.resumes.length">
        <div class="py-10 text-center"><UIcon name="i-lucide-file-plus-2" class="mx-auto size-11 text-muted" /><h3 class="mt-3 font-semibold text-highlighted">Create your first targeted resume</h3><p class="mx-auto mt-1 max-w-md text-sm text-muted">Start from your profile, import your uploaded CV, or begin with a clean page.</p><UButton class="mt-5" label="Create resume" icon="i-lucide-plus" @click="createOpen = true" /></div>
      </UCard>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <UCard v-for="resume in store.resumes" :key="resume.id">
          <div class="flex h-full flex-col gap-4">
            <div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="truncate font-semibold text-highlighted">{{ resume.name }}</h3><p class="mt-1 text-xs text-muted">Updated {{ formatUpdated(resume.updated_at) }}</p></div><UBadge label="ATS Classic" color="neutral" variant="subtle" /></div>
            <p class="line-clamp-2 text-sm text-muted">{{ resume.content.basics.headline || resume.content.basics.summary || 'Add your details and tailor this resume for a role.' }}</p>
            <div class="mt-auto flex flex-wrap gap-2">
              <UButton :to="`/resumes/${resume.id}`" label="Edit" icon="i-lucide-pencil" size="sm" />
              <UButton icon="i-lucide-text-cursor-input" size="sm" color="neutral" label="Rename" @click="openRename(resume)" />
              <UButton icon="i-lucide-trash-2" size="sm" color="error" label="Delete resume" @click="openDelete(resume)" />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <UModal v-model:open="createOpen" title="Create a resume" description="Choose how you want to start.">
      <template #body><div class="space-y-5"><UFormField label="Resume name"><UInput v-model="newName" maxlength="120" class="w-full" /></UFormField><URadioGroup v-model="creationSource" :items="creationOptions" /></div></template>
      <template #footer><div class="flex w-full justify-end gap-2"><UButton label="Cancel" color="neutral" variant="outline" @click="createOpen = false" /><UButton label="Create resume" :loading="creating" @click="createDraft" /></div></template>
    </UModal>
    <UModal v-model:open="renameOpen" title="Rename resume">
      <template #body><UFormField label="Resume name"><UInput v-model="renameValue" maxlength="120" class="w-full" @keyup.enter="renameDraft" /></UFormField></template>
      <template #footer><div class="flex w-full justify-end gap-2"><UButton label="Cancel" color="neutral" variant="outline" @click="renameOpen = false" /><UButton label="Rename" :loading="workingId === selected?.id" @click="renameDraft" /></div></template>
    </UModal>
    <UModal v-model:open="deleteOpen" title="Delete resume" description="This cannot be undone.">
      <template #body><p class="text-sm text-muted">Delete “{{ selected?.name }}” permanently?</p></template>
      <template #footer><div class="flex w-full justify-end gap-2"><UButton label="Cancel" color="neutral" variant="outline" @click="deleteOpen = false" /><UButton label="Delete" color="error" :loading="workingId === selected?.id" @click="deleteDraft" /></div></template>
    </UModal>
  </UContainer>
</template>
