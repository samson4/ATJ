<template>
  <!-- show skeleton while loading -->
  <div v-if="loading">
    <JobCardSkeleton />
  </div>

  <div v-else-if="filteredJobs.length" class="space-y-4 ">
    <UCard
      v-for="job in filteredJobs"
      
      :key="job.id"
      @click="selectJob(job)"
      class="text-sm cursor-pointer border-l-2 transition-colors my-6"
      :class="[
        selectedJob && selectedJob.id === job.id
          ? 'border-primary bg-primary/10'
          : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
      ]"
    > 
    <!-- <template #content> -->
      <div class="flex  gap-4">
        <UAvatar :src="job.company_logo" icon="i-heroicons-building-office-2" size="lg" />

        <div class="flex-1">
          <div class="flex items-start justify-between gap-3">
            
            <div class="gap-4">
              <div class="flex justify-between">
<NuxtLink  class="text-sm text-primary-600 font-medium">
                {{ job.company_name }}
              </NuxtLink>
              <UBadge icon="i-heroicons-map-pin" size="sm" variant="outline" v-if="job.workplace" color="neutral">{{ (job.workplace || '').toString().replace(/^\w/, c => c.toUpperCase()) }}</UBadge>
            
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
    <div class="flex justify-center">
      <UPagination
    v-if="showPagination"
    v-model:page="page"
    :items-per-page="itemsPerPage"
    active-color="primary"
    :total="totalJobs"
  />
  </div>
  </div>
  <div v-else class="text-center py-10 text-gray-500">
    {{ emptyMessage }}
  </div>
</template>

<script setup lang="ts">
import JobCardSkeleton from './JobCardSkeleton.vue'
import { useJobStore } from "~/stores/job"
import { marked } from 'marked';
import type { Job } from '~/interfaces/jobInterface'
const { $supabase } = useNuxtApp()
const props = defineProps({
  job: {
    type: Object,
    default: () => ({})
  },
  jobs: {
    type: Array,
    default: null
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  fetchOnMount: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  emptyMessage: {
    type: String,
    default: 'No jobs found matching the selected criteria.'
  }
})



//data & store usage
const jobStore = useJobStore()
const jobs = computed<Job[]>(() => {
  return Array.isArray(props.jobs) ? props.jobs as Job[] : jobStore.jobList || []
})
const loading = ref(props.fetchOnMount)
const page = ref(1)

const itemsPerPage = ref(50)
const totalJobs = ref(0)
const selectedJob = computed(() => jobStore.selectedJob)

// helpers for display
const truncate = (text: string | undefined | null, n = 120) => {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '...' : text
}



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

//methods
const selectJob = (job: Job) => {
  if (jobStore.selectedJob && jobStore.selectedJob.id == job.id) {
    jobStore.selectedJob = {}
  } else {
    jobStore.selectedJob = job
  }
}
const isSaved = (jobId?: string) => {
  return jobStore.isJobSaved(jobId)
}
const isSaving = (jobId?: string) => {
  return jobStore.isSavingJob(jobId)
}
const toggleSaved = async (jobId?: string) => {
  await jobStore.toggleSavedJob(jobId)
}
const fetchJobs = async () => {
  loading.value = true
  try {
    const from = (page.value - 1) * itemsPerPage.value
    const to = page.value * itemsPerPage.value - 1

    const { data, error, count } = await $supabase
      .schema("jobs")
      .from('job_with_company_info')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    jobStore.jobList = data || []
    totalJobs.value = typeof count === 'number' ? count : (data || []).length
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
//hooks: fetch jobs and store into jobStore.jobList (keeps existing behavior)
onMounted(async()=>{
  if (props.fetchOnMount) {
    fetchJobs()
  } else {
    loading.value = false
  }

  jobStore.fetchSavedJobIds()
})

watch([page, itemsPerPage], () => {
  if (props.fetchOnMount) {
    fetchJobs()
  }
})
</script>
