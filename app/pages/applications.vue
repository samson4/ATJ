<template>
  <UContainer class="py-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Applications
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Track jobs you have submitted applications for.
      </p>
    </div>

    <div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <ProfileSidebar active="applications" />
      </div>

      <div class="lg:col-span-2 space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center space-x-2">
              <UIcon
                name="i-lucide-clipboard-list"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Tracked Applications
              </h2>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Jobs you confirmed you applied to.
            </p>
          </template>

          <div v-if="jobStore.loadingAppliedJobs" class="space-y-4">
            <USkeleton v-for="item in 3" :key="item" class="h-20 w-full" />
          </div>

          <div v-else-if="!jobStore.appliedJobs.length" class="py-8 text-center">
            <UIcon name="i-lucide-clipboard-check" class="mx-auto size-10 text-muted" />
            <h3 class="mt-3 font-medium text-default">No tracked applications yet</h3>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
              After submitting a job application, confirm it from the job detail view and it will appear here.
            </p>
            <UButton to="/" icon="i-lucide-search" class="mt-6">
              Browse Jobs
            </UButton>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="application in jobStore.appliedJobs"
              :key="application.application_id || application.id"
              class="flex cursor-pointer flex-col gap-3 rounded-lg border border-muted p-4 transition-colors hover:border-primary hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"
              role="button"
              tabindex="0"
              @click="openApplication(application)"
              @keydown.enter="openApplication(application)"
            >
              <div class="flex min-w-0 items-start gap-3">
                <UAvatar :src="application.company_logo" icon="i-heroicons-building-office-2" size="md" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-default">
                    {{ application.role || application.title || 'Untitled Role' }}
                  </p>
                  <p class="truncate text-sm text-muted">
                    {{ application.company_name || 'Company' }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    Applied {{ formatAppliedDate(application.applied_at || application.tracked_at) }}
                  </p>
                </div>
              </div>

              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="outline"
                size="sm"
                class="w-full justify-center sm:w-auto"
                :loading="jobStore.isRemovingAppliedJob(application.id)"
                :disabled="jobStore.isRemovingAppliedJob(application.id)"
                @click.stop="removeApplication(application.id)"
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
import { useJobStore } from "~/stores/job";

definePageMeta({ layout: "default", middleware: "auth" });
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
  await jobStore.fetchAppliedJobs()
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileView)
})

watch(detailOpen, (open) => {
  if (!open) {
    jobStore.selectedJob = {}
  }
})

watch(() => jobStore.appliedJobs.length, () => {
  if (!selectedJob.value?.id) return

  const selectedStillApplied = jobStore.appliedJobs.some((job) => job.id === selectedJob.value.id)
  if (!selectedStillApplied) closeDetail()
})

const formatAppliedDate = (date?: string | null) => {
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
};

const removeApplication = async (jobId?: string) => {
  await jobStore.removeAppliedJob(jobId)
};

const openApplication = (application: any) => {
  if (!application?.id) return;

  jobStore.selectedJob = application
  detailOpen.value = true
};

const closeDetail = () => {
  detailOpen.value = false
  jobStore.selectedJob = {}
};
</script>
