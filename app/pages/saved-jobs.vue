<template>
  <UContainer class="py-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Saved Jobs
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Keep track of roles you want to revisit.
      </p>
    </div>

    <div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <ProfileSidebar active="savedJobs" />
      </div>

      <div class="lg:col-span-2 space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center space-x-2">
              <UIcon
                name="i-lucide-bookmark"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Saved Roles
              </h2>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Jobs you want to revisit later.
            </p>
          </template>

          <div v-if="jobStore.loadingSavedJobs" class="space-y-4">
            <USkeleton v-for="item in 3" :key="item" class="h-20 w-full" />
          </div>

          <div v-else-if="!jobStore.savedJobs.length" class="py-8 text-center">
            <UIcon name="i-lucide-bookmark" class="mx-auto size-10 text-muted" />
            <h3 class="mt-3 font-medium text-default">No saved jobs yet</h3>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
              Save jobs from the job list or detail view and they will show up here.
            </p>
            <UButton to="/" icon="i-lucide-search" class="mt-6">
              Browse Jobs
            </UButton>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="job in jobStore.savedJobs"
              :key="job.saved_job_id || job.id"
              class="flex cursor-pointer flex-col gap-3 rounded-lg border border-muted p-4 transition-colors hover:border-primary hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"
              role="button"
              tabindex="0"
              @click="openSavedJob(job)"
              @keydown.enter="openSavedJob(job)"
            >
              <div class="flex min-w-0 items-start gap-3">
                <UAvatar :src="job.company_logo" icon="i-heroicons-building-office-2" size="md" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-default">
                    {{ job.role || job.title || 'Untitled Role' }}
                  </p>
                  <p class="truncate text-sm text-muted">
                    {{ job.company_name || 'Company' }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    Saved {{ formatSavedDate(job.saved_at) }}
                  </p>
                </div>
              </div>

              <UButton
                icon="i-lucide-bookmark-minus"
                color="error"
                variant="outline"
                size="sm"
                class="w-full justify-center sm:w-auto"
                :loading="jobStore.isSavingJob(job.id)"
                :disabled="jobStore.isSavingJob(job.id)"
                @click.stop="removeSavedJob(job.id)"
              >
                Remove
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <ClientOnly>
      <USlideover
        v-if="!isMobile"
        v-model:open="detailOpen"
        class="max-w-2xl"
      >
        <template #content>
          <JobDetail v-if="selectedJob?.id" @close="closeDetail" />
        </template>
      </USlideover>

      <UDrawer
        v-if="isMobile"
        v-model:open="detailOpen"
        title="Job details"
        close-icon="i-lucide-x"
        :close="{
          color: 'primary',
          variant: 'outline',
          class: 'rounded-full'
        }"
        :dismissible="false"
        :handle="false"
        :modal="true"
        :ui="{
          content: 'h-[88dvh] max-h-[88dvh]',
          container: 'h-full min-h-0 gap-0 overflow-hidden p-0',
          header: 'border-b border-muted px-4 py-3',
          body: 'min-h-0 flex-1 overflow-y-auto p-0'
        }"
      >
        <template #body>
          <JobDetail v-if="selectedJob?.id" :full-height="false" @close="closeDetail" />
        </template>
      </UDrawer>
    </ClientOnly>
  </UContainer>
</template>

<script setup lang="ts">
import { useJobStore } from '~/stores/job'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})
useSeoMeta({
  robots: 'noindex, nofollow'
})

const jobStore = useJobStore()
const detailOpen = ref(false)
const selectedJob = computed(() => jobStore.selectedJob)
const isMobile = ref(false)
let mobileMediaQuery: MediaQueryList | null = null

const syncMobileView = () => {
  isMobile.value = mobileMediaQuery?.matches ?? false
}

onMounted(async () => {
  jobStore.selectedJob = {}
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  syncMobileView()
  mobileMediaQuery.addEventListener('change', syncMobileView)
  await jobStore.fetchSavedJobs()
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileView)
})

watch(detailOpen, (open) => {
  if (!open) {
    jobStore.selectedJob = {}
  }
})

watch(() => jobStore.savedJobs.length, () => {
  if (!selectedJob.value?.id) return

  const selectedStillSaved = jobStore.savedJobs.some((job) => job.id === selectedJob.value.id)
  if (!selectedStillSaved) closeDetail()
})

const formatSavedDate = (date?: string | null) => {
  if (!date) return 'recently'

  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

const openSavedJob = (job: any) => {
  if (!job?.id) return

  jobStore.selectedJob = job
  detailOpen.value = true
}

const removeSavedJob = async (jobId?: string) => {
  await jobStore.unsaveJob(jobId)
}

const closeDetail = () => {
  detailOpen.value = false
  jobStore.selectedJob = {}
}
</script>
