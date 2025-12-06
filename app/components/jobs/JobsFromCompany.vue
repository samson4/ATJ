<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked';
import JobDetail from '~/components/JobDetail.vue'


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
const overlay = useOverlay()
const open = ref(false)
async function openModal(job: Job) {
  const modal = overlay.create(JobDetail, {
    job: job
  })
  modal.open()
}

const { $supabase } = useNuxtApp()
const route = useRoute()
const loading = ref(true)
const jobs = ref<Job[]>([])
import { useJobStore } from "~/stores/job"

const jobStore = useJobStore()

const selectJob = (job: Job) => {
  if (jobStore.selectedJob && jobStore.selectedJob.id == job.id) {
    jobStore.selectedJob = {}
   
  } else {
    jobStore.selectedJob = job
     open.value = true
  }
}

const selectedJob = computed(() => jobStore.selectedJob)

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
const truncate = (text: string | undefined | null, n = 120) => {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '...' : text
}
onMounted(async () => {
  loading.value = true
  const { data, error } = await $supabase.schema("jobs")
    .from('job_with_company_info')
    .select(`*`)
    .eq("company_id", route.params.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  } else {
    if(jobStore.selectedJob){
      open.value = true
    }
    jobs.value = data
  }
  loading.value = false
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

        <div class="flex-1">
          <div class="flex items-start justify-between gap-3">
            <div>
              <NuxtLink :to="`/company/${job.company_id}`" class="text-sm text-primary-600 font-medium">
                {{ job.company_name }}
              </NuxtLink>
              <h3 class="text-lg font-semibold mt-1">{{ job.role }}</h3>
              <div v-html="marked.parse(truncate(job.job_description, 120))" class="text-sm mt-1 line-clamp-2"></div>
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
      <USlideover 
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
          <div v-if="selectedJob && selectedJob.id" class="h-full">
            <JobDetail @close="selectedJob = null" />
          </div>
        </Transition>
      </template>
    </USlideover>
     
  </div>
</template>