<template>
  <UContainer class="py-8">
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold text-highlighted">
        Application Tracker
      </h1>
     <div>
        <!-- <div class="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-1">
          {{ new Date().toDateString() }}
        </div> -->
      
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          A clear view of every opportunity, and what to do next.
        </p>
      </div>
    </div>

    <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <ProfileSidebar active="applications" />
      </div>

      <div class="space-y-6 lg:col-span-2">
      
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UCard :ui="{ body: { padding: 'p-4 sm:p-5' } }" class="bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Applications</div>
                <div class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mt-0.5">
                  {{ String(jobStore.appliedJobsTotal || jobStore.appliedJobs.length).padStart(2, '0') }}
                </div>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">all time</div>
            </div>
          </UCard>
          <UCard :ui="{ body: { padding: 'p-4 sm:p-5' } }" class="bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400">In motion</div>
                <div class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mt-0.5">
                  {{ String(jobStore.appliedJobs.length ? Math.min(jobStore.appliedJobs.length, 3) : 0).padStart(2, '0') }}
                </div>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">active now</div>
            </div>
          </UCard>
          <UCard :ui="{ body: { padding: 'p-4 sm:p-5' } }" class="bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Next actions</div>
                <div class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mt-0.5">
                  02
                </div>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">this week</div>
            </div>
          </UCard>
        </div>

        <!-- Applications Table / List Section -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Applications</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your search, in one place.</p>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <USelect
                v-model="statusFilter"
                :items="filterItems"
                value-key="value"
                label-key="label"
                size="sm"
                class="min-w-0 flex-1 sm:w-36"
                aria-label="Filter applications by status"
              />
              <USelect
                v-model="sortMode"
                :items="sortItems"
                value-key="value"
                label-key="label"
                size="sm"
                class="min-w-0 flex-1 sm:w-36"
                aria-label="Sort applications"
              />
            </div>
          </div>

          <UCard  class="dark:border-gray-800 rounded-sm overflow-hidden bg-white/80 dark:bg-gray-900/80 shadow-sm">
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div v-if="jobStore.loadingAppliedJobs" class="p-6 space-y-4 w-full">
                <USkeleton v-for="item in 3" :key="item" class="h-20 w-full rounded-lg" />
              </div>

              <div v-else-if="!jobStore.appliedJobs.length" class="py-12">
                <UIcon name="i-lucide-clipboard-check" class="mx-auto size-10 text-gray-400" />
                <h3 class="mt-3 font-medium text-gray-900 dark:text-white">
                  {{ statusFilter === 'all' ? 'No tracked applications yet' : 'No applications in this status' }}
                </h3>
                <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                  {{ statusFilter === 'all'
                    ? 'After submitting a job application, confirm it from the job detail view and it will appear here.'
                    : 'Try another status filter to see more of your applications.' }}
                </p>
                <UButton v-if="statusFilter === 'all'" to="/" icon="i-lucide-search" class="mt-6 bg-[#24594a] hover:bg-[#1d473b] text-white">
                  Browse Jobs
                </UButton>
                <UButton v-else variant="soft" color="neutral" class="mt-6" @click="statusFilter = 'all'">
                  Clear status filter
                </UButton>
              </div>

              <template v-else>
                <div
                  v-for="(application, index) in jobStore.appliedJobs"
                  :key="application.application_id || application.id"
                  class="px-4 sm:p-5 hover:bg-primary/5 cursor-pointer space-y-3"
                  @click="openApplication(application)">

                  <!-- Top row: Company Avatar, Role details, Status dropdown & Remove button -->
                  <div class=" flex items-center justify-between gap-3 min-w-0">
                    <div class="flex items-center gap-3 min-w-0">
                      <UAvatar :src="application.company_logo" icon="i-heroicons-building-office-2" size="lg" />
                      <div class="min-w-0">
                        <div class="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {{ application.role || application.title || 'Untitled Role' }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {{ application.company_name || 'Company' }} · {{ application.location || 'Remote' }} · 
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          Applied {{ formatAppliedDate(application.applied_at || application.tracked_at) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0" @click.stop>
                      <USelect
                        :model-value="normalizeStatus(application.status)"
                        :items="statusOptions"
                        value-key="value"
                        label-key="label"
                        size="xs"
                        :color="getStatusColor(application.status)"
                        :disabled="jobStore.isUpdatingApplicationStatus(application.id)"
                        :aria-label="`Update status for ${application.role || application.title || 'application'} at ${application.company_name || 'company'}`"
                        class="w-36 sm:w-44"
                        @update:model-value="(status) => updateStatus(application, status)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        :aria-label="`Remove ${application.role || application.title || 'application'}`"
                        :loading="jobStore.isRemovingAppliedJob(application.id)"
                        :disabled="jobStore.isRemovingAppliedJob(application.id)"
                        @click="removeApplication(application.id)"
                      />
                    </div>
                  </div>

                  <!-- Bottom row: Progress Status Label & Progress Bar -->
                  <div class="min-w-0 pl-12">
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <span class="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {{ getStatusLabel(application.status) }}
                      </span>
                      <span v-if="getProgressStep(application.status) !== null" class="shrink-0 text-[10px] text-gray-400">
                        Step {{ getProgressStep(application.status) }} of 7
                      </span>
                    </div>
                    <div v-if="getProgressValue(application.status) !== null" class="mt-1.5">
                      <UProgress
                        :model-value="getProgressValue(application.status) ?? 0"
                        :max="100"
                        :color="getStatusColor(application.status)"
                        size="2xs"
                        :aria-label="`${getStatusLabel(application.status)} progress: ${getProgressValue(application.status)} percent`"
                      />
                    </div>
                    <div v-else class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      {{ isTerminalStatus(application.status) ? 'Application closed' : 'Temporarily paused' }}
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <template v-if="jobStore.appliedJobsTotal > 0" #footer>
              <div class="flex justify-center">
                <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="jobStore.appliedJobsTotal" />
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <ClientOnly>
      <USlideover v-if="!isMobile" v-model:open="detailOpen" class="max-w-2xl">
        <template #content>
          <JobDetail v-if="selectedJob?.id" @close="closeDetail" />
        </template>
      </USlideover>

      <UDrawer v-if="isMobile" v-model:open="detailOpen" title="Job details" close-icon="i-lucide-x" :close="{
        color: 'primary',
        variant: 'outline',
        class: 'rounded-full'
      }" :dismissible="false" :handle="false" :modal="true" :ui="{
          content: 'h-[88dvh] max-h-[88dvh]',
          container: 'h-full min-h-0 gap-0 overflow-hidden p-0',
          header: 'border-b border-muted px-4 py-3',
          body: 'min-h-0 flex-1 overflow-y-auto p-0'
        }">
        <template #body>
          <JobDetail v-if="selectedJob?.id" :full-height="false" @close="closeDetail" />
        </template>
      </UDrawer>
    </ClientOnly>
  </UContainer>
</template>

<script setup lang="ts">
import { useJobStore, type ApplicationStatus } from "~/stores/job";
import DisplayConfirmation from '~/components/display/Confirmation.vue'

definePageMeta({ layout: "default", middleware: "auth" });
useSeoMeta({
  robots: 'noindex, nofollow'
})

const jobStore = useJobStore()
const overlay = useOverlay()
const detailOpen = ref(false)
const selectedJob = computed(() => jobStore.selectedJob)
const page = ref(1)
const itemsPerPage = 10
const statusFilter = ref<'all' | ApplicationStatus>('all')
const sortMode = ref<'recent' | 'oldest' | 'company' | 'role' | 'status'>('recent')
const isMobile = ref(false)
let mobileMediaQuery: MediaQueryList | null = null

const statusOptions: { label: string; value: ApplicationStatus }[] = [
  { label: 'Applied', value: 'applied' },

  { label: 'Assessment', value: 'assessment' },
  { label: 'First Interview', value: 'interview_1' },
  { label: 'Technical Interview', value: 'interview_2' },
  { label: 'Final Interview', value: 'interview_3' },
  { label: 'Offer', value: 'offer' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrew', value: 'withdrawn' },
  { label: 'Declined offer', value: 'declined_offer' },
  { label: 'On hold', value: 'on_hold' }
]

const progressStatuses: ApplicationStatus[] = [
  'applied',
  'assessment',
  'interview_1',
  'interview_2',
  'interview_3',
  'offer',
  'accepted'
]

const filterItems = computed(() => [
  { label: 'All statuses', value: 'all' },
  ...statusOptions
])

const sortItems = [
  { label: 'Most recent', value: 'recent' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Company A–Z', value: 'company' },
  { label: 'Role A–Z', value: 'role' },
  { label: 'Status', value: 'status' }
]

const sortOptions = {
  recent: { sortBy: 'applied_at', sortOrder: 'desc' },
  oldest: { sortBy: 'applied_at', sortOrder: 'asc' },
  company: { sortBy: 'company_name', sortOrder: 'asc' },
  role: { sortBy: 'role', sortOrder: 'asc' },
  status: { sortBy: 'status', sortOrder: 'asc' }
} as const

const fetchApplications = () => {
  const sort = sortOptions[sortMode.value]
  return jobStore.fetchAppliedJobs(page.value, itemsPerPage, {
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value
  })
}

const syncMobileView = () => {
  isMobile.value = mobileMediaQuery?.matches ?? false
}

onMounted(async () => {
  jobStore.selectedJob = {}
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  syncMobileView()
  mobileMediaQuery.addEventListener('change', syncMobileView)
  await Promise.all([
    jobStore.fetchAppliedJobIds(),
    fetchApplications()
  ])
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

watch([statusFilter, sortMode], async () => {
  if (page.value !== 1) {
    page.value = 1
    return
  }
  closeDetail()
  await fetchApplications()
})

watch(page, async () => {
  closeDetail()
  await fetchApplications()
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

const normalizeStatus = (status?: string): ApplicationStatus => {
  return statusOptions.some((option) => option.value === status)
    ? status as ApplicationStatus
    : 'applied'
}

const getStatusLabel = (status?: string) => {
  return statusOptions.find((option) => option.value === normalizeStatus(status))?.label || 'Applied'
}

const isTerminalStatus = (status?: string) => {
  return ['accepted', 'rejected', 'withdrawn', 'declined_offer'].includes(normalizeStatus(status))
}

const getProgressStep = (status?: string): number | null => {
  const normalizedStatus = normalizeStatus(status)
  const index = progressStatuses.indexOf(normalizedStatus)
  return index === -1 ? null : index + 1
}

const getProgressValue = (status?: string): number | null => {
  const step = getProgressStep(status)
  if (step === null) {
    return null
  }
  return Math.round((step / progressStatuses.length) * 100)
}

const getStatusColor = (status?: string) => {
  const normalizedStatus = normalizeStatus(status)
  if (['accepted', 'offer'].includes(normalizedStatus)) return 'success'
  if (['rejected', 'declined_offer'].includes(normalizedStatus)) return 'error'
  if (['assessment', 'on_hold'].includes(normalizedStatus)) return 'warning'
  if (normalizedStatus.startsWith('interview_')) return 'primary'
  return 'neutral'
}

const updateStatus = async (application: any, nextStatus: ApplicationStatus | string) => {
  const jobId = application?.id
  const status = normalizeStatus(nextStatus)
  if (!jobId || status === normalizeStatus(application.status)) return

  const updated = await jobStore.updateAppliedJobStatus(jobId, status)
  if (updated) await refreshApplications()
}

const refreshApplications = async () => {
  await fetchApplications()
  const lastPage = Math.max(1, Math.ceil(jobStore.appliedJobsTotal / itemsPerPage))
  if (page.value > lastPage) page.value = lastPage
}

const removeApplication = (jobId?: string) => {
  if (!jobId) return

  const modal = overlay.create(DisplayConfirmation)
  modal.open({
    title: 'Remove tracked application?',
    message: 'This application will be removed from your tracked applications.',
    onConfirm: async () => {
      const previousTotal = jobStore.appliedJobsTotal
      await jobStore.removeAppliedJob(jobId)
      modal.close()


      if (jobStore.appliedJobsTotal === previousTotal) return

      const lastPage = Math.max(1, Math.ceil(jobStore.appliedJobsTotal / itemsPerPage))
      if (page.value > lastPage) {
        page.value = lastPage
      } else {
        await refreshApplications()
      }
    }
  })
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