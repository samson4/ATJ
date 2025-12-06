<template>
  <!-- show skeleton while loading -->
  <div v-if="loading">
    <JobCardSkeleton />
  </div>

  <div v-else class="space-y-4">
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
<NuxtLink :to="`/company/${job.company_id}`" class="text-sm text-primary-600 font-medium">
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
             
            </div>
            <div class="flex flex-col items-end gap-2">
             
              <div class="text-sm text-gray-500">
                <div v-if="job.deadline">Deadline {{ formatDate(job.deadline) }}</div>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import JobCardSkeleton from './JobCardSkeleton.vue'
import { useJobStore } from "~/stores/job"
import { marked } from 'marked';
const { $supabase } = useNuxtApp()
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

// Updated Job interface to include all fields used across the app
interface Job {
  id: string;
  // timestamps
  created_at: string | null;
  updated_at?: string | null;

  // job/role fields
  role: string;
  title?: string;
  job_description?: string | null;
  short_description?: string | null;
  description?: string | null;

  // company relation
  company_id: string;
  company_name: string;
  company_logo?: string | null;
  company_website?: string | null;
  company_description?: string | null;

  // meta
  tags?: string[]; // tag list
  workplace?: string; // remote / onsite / hybrid / contract
  employment_type?: string; // full-time, part-time, contract ...
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;

  // application & verification
  link?: string | null; // application link / email
  deadline?: string | null;
  rating?: number | null;
  verified?: boolean | null;
  proposals?: number | null;

  // any extra fields
  [key: string]: any;
}

//data & store usage
const jobStore = useJobStore()
const jobs = computed<Job[]>(() => jobStore.jobList || [])
const loading = ref(true)

const selectedJob = computed(() => jobStore.selectedJob)

// helpers for display
const truncate = (text: string | undefined | null, n = 120) => {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '...' : text
}

const formatMoney = (value: number | undefined | null) => {
  if (value == null) return '—'
  if (value >= 1000) return `$${Math.round(value / 1000)}k`
  return `$${value}`
}

const hasSalary = (job: Job) => {
  return job.salary_min != null || job.salary_max != null
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

const timeAgo = (d?: string | null) => {
  if (!d) return 'unknown'
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d`
}

const capitalize = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// compute apply link (support mailto and URLs)
const applyLink = (job: Job) => {
  if (!job.link) return `/company/${job.company_id}`
  if (job.link.startsWith('mailto:')) return job.link
  if (job.link.includes('@') && !job.link.startsWith('http')) return `mailto:${job.link}`
  return job.link
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

//hooks: fetch jobs and store into jobStore.jobList (keeps existing behavior)
onMounted(async()=>{
  loading.value = true
  try {
    const { data, error } = await $supabase.schema("jobs")
      .from('job_with_company_info')
      .select(`*`)
      .order('created_at', { ascending: false })
    if (error) throw error
    // keep the store assignment so other components can access list
    jobStore.jobList = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>