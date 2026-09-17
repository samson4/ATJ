<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { marked } from 'marked';
import type { Job } from '~/interfaces/jobInterface'

const props = defineProps({
  job: {
    type: Object,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({})
  }
})

const open = ref(false)
const isMobile = ref(false)
let mobileMediaQuery: MediaQueryList | null = null

const syncMobileView = () => {
  isMobile.value = mobileMediaQuery?.matches ?? false
}

const { $supabase } = useNuxtApp()
const route = useRoute()
const loading = ref(true)
const jobs = ref<Job[]>([])
const page = ref(1)

const itemsPerPage = ref(10)
const totalJobs = ref(0)
import { useJobStore } from "~/stores/job"

const jobStore = useJobStore()

const selectJob = (job: Job) => {
  const current = jobStore.selectedJob
 
  if (current && current.id === job.id) {
    open.value = !open.value
    if (!open.value) jobStore.selectedJob = {}
  } else {
    
    jobStore.selectedJob = job
    open.value = true
  }
}

const selectedJob = computed(() => jobStore.selectedJob)

const isSaved = (jobId?: string) => {
  return jobStore.isJobSaved(jobId)
}

const isSaving = (jobId?: string) => {
  return jobStore.isSavingJob(jobId)
}

const toggleSaved = async (jobId?: string) => {
  await jobStore.toggleSavedJob(jobId)
}


watch(open, (val) => {
  if (!val) {
    
    jobStore.selectedJob = {}
  }
})

watch([page, itemsPerPage], () => {
  fetchJobs()
})

const visibleTags = (job: Job) => {
  const t = job.tags || []
  return t.slice(0, 5)
}

const extraTagCount = (job: Job) => {
  const t = job.tags || []
  return Math.max(0, t.length - 5)
}

const formatDate = (d?: string | null) => {
  if (!d) return ''
 
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return d
  }
}

const formatWorkplace = (workplace?: string | null) => {
  if (!workplace) return ''

  return workplace.toString().replace(/^\w/, c => c.toUpperCase())
}

// computed filtered list based on filters prop (keeps existing logic)
const filteredJobs = computed(() => {
  const f = props.filters || {}
  const company = (f.companyName || '').toString().toLowerCase().trim()
  const tags = Array.isArray(f.tags) ? f.tags : []
  const minSalary = f.salaryMin
  const maxSalary = f.salaryMax
  const workplace = f.workplace

  return (jobs.value || []).filter((job: any) => {
    // company name filter
    if (company) {
      if (!job.company_name || !job.company_name.toLowerCase().includes(company)) return false
    }

    // workplace filter
    if (workplace && job.workplace !== workplace) return false

    // tags filter (if any tag selected, require job.tags to include at least one)
    if (tags.length) {
      if (!Array.isArray(job.tags) || !tags.some((t: string) => job.tags.includes(t))) return false
    }
    // salary range filter (if job has salary_min/max)
    if ((minSalary || maxSalary) && (job.salary_min || job.salary_max)) {
      const jMin = job.salary_min ?? -Infinity
      const jMax = job.salary_max ?? Infinity
      if (minSalary != null && jMax < minSalary) return false
      if (maxSalary != null && jMin > maxSalary) return false
    }
    return true
  })
})
const truncate = (text: string | undefined | null, n = 120) => {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '...' : text
}

const fetchJobs = async()=>{
  loading.value = true
      const from = (page.value - 1) * itemsPerPage.value
    const to = page.value * itemsPerPage.value - 1
  try{
    
  const { data, error, count } = await $supabase.schema("jobs")
    .from('job_with_company_info')
    // request exact count so we can use pagination UI
    .select(`*`, { count: 'exact' })
    .eq("company_id", route.params.id)
    .order('created_at', { ascending: false })
    .range(from, to)

     if (error) throw error
    jobStore.selectedJob = {}
    jobStore.jobList = data || []
    jobs.value = data
    totalJobs.value = typeof count === 'number' ? count : (data || []).length

  loading.value = false
} catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

//hooks
onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  syncMobileView()
  mobileMediaQuery.addEventListener('change', syncMobileView)

  fetchJobs()
  jobStore.fetchSavedJobIds()
  jobStore.fetchAppliedJobIds()
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileView)
})
</script>

<template>
  <!-- show skeleton while loading -->
  <div v-if="loading">
    <JobCardSkeleton />
  </div>

  <div v-else class="space-y-3">
    <UCard
      v-for="job in filteredJobs"
      :key="job.id"
      @click="selectJob(job)"
      class="text-sm cursor-pointer border-l-2 transition-colors my-2"
      :class="[
        selectedJob && selectedJob.id === job.id 
          ? 'border-primary bg-primary/10'
          : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
      ]"
    > 
    <!-- <template #content> -->
      <div class="flex gap-4">
        <UAvatar :src="job.company_logo" icon="i-heroicons-building-office-2" size="lg" />

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 gap-4">
              <div class="flex min-w-0 items-start justify-between gap-3">
                <div class="min-w-0">
                  <NuxtLink class="block truncate text-sm font-medium text-primary-600">
                    {{ job.company_name }}
                  </NuxtLink>
                  <div v-if="job.workplace" class="mt-1 flex items-center gap-1 text-[11px] leading-none text-muted sm:hidden">
                    <UIcon name="i-heroicons-map-pin" class="size-3 shrink-0" />
                    <span class="truncate">{{ formatWorkplace(job.workplace) }}</span>
                  </div>
                </div>
                <UBadge
                  v-if="job.workplace"
                  icon="i-heroicons-map-pin"
                  size="sm"
                  variant="outline"
                  color="neutral"
                  class="hidden shrink-0 sm:inline-flex"
                >
                  {{ formatWorkplace(job.workplace) }}
                </UBadge>
              </div>
              
              <h3 class="text-lg font-semibold mt-1">{{ job.role }}</h3>
              
          
              <div v-html="marked.parse( truncate(job.job_description, 120))" class="text-sm mt-1 line-clamp-2"></div>
              
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600">
             
             <div>
              <span v-if="job.verified" class="text-blue-500 ml-2">Verified</span>
             </div>
             <UButton
               :aria-label="isSaved(job.id) ? 'Remove saved job' : 'Save job'"
               :icon="isSaved(job.id) ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
               :color="isSaved(job.id) ? 'primary' : 'neutral'"
               :variant="isSaved(job.id) ? 'solid' : 'outline'"
               :loading="isSaving(job.id)"
               :disabled="isSaving(job.id)"
               size="sm"
               square
               @click.stop="toggleSaved(job.id)"
             />
             
            </div>
          </div>

         
         
         
        </div>
      </div>
    <!-- </template> -->
    <template #footer>
             <!-- Footer: meta and actions -->
          <div class="mt-4 flex items-center justify-between">
            
 <!-- Tags -->
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <UBadge v-for="(tag, idx) in visibleTags(job)" :key="`tag-${job.id}-${idx}`" variant="soft">
              {{ tag }}
            </UBadge>
            <UBadge v-if="extraTagCount(job) > 0" color="neutral" variant="outline">+{{ extraTagCount(job) }}</UBadge>
          </div>
           <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar-solid"/>
                <!-- <span>{{ job.rating ?? '—' }}</span> -->
                  <span class="text-xs text-muted">{{ formatDate(job.created_at) }}</span>
                
              </div>
          </div>
          </template>
    </UCard>
    <ClientOnly>
      <USlideover
        v-if="!isMobile"
        v-model:open="open"
        class="max-w-2xl"
      >
        <template #content>
          <Transition
            enter-active-class="transition-opacity duration-500"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-500"
            leave-to-class="opacity-0"
          >
            <div v-if="selectedJob?.id" class="h-full">
              <JobDetail />
            </div>
          </Transition>
        </template>
      </USlideover>

      <UDrawer
        v-if="isMobile"
        v-model:open="open"
        title="Job details"
        close-icon="i-lucide-x"
        :close="{
          color: 'primary',
          variant: 'outline',
          class: 'rounded-full'
        }"
        :dismissible="false"
        :handle="false"
        :ui="{
          content: 'h-[88dvh] max-h-[88dvh]',
          container: 'h-full min-h-0 gap-0 overflow-hidden p-0',
          header: 'border-b border-muted px-4 py-3',
          body: 'min-h-0 flex-1 overflow-y-auto p-0'
        }"
      >
        <template #body>
          <JobDetail v-if="selectedJob?.id" :full-height="false" />
        </template>
      </UDrawer>
    </ClientOnly>
     <div class="flex justify-center my-4">
      <UPagination
    v-model:page="page"
    :items-per-page="itemsPerPage"
    active-color="primary"
    :total="totalJobs"
  />
  </div>
  </div>
</template>
