<template>
  <!-- show skeleton while loading -->
  <div v-if="loading">
    <JobCardSkeleton />
  </div>

  <!-- make the list area independently scrollable -->
  <div v-else class="h-[calc(100vh-10rem)] overflow-y-auto space-y-2">
    <UCard
      v-for="job in filteredJobs"
      :key="job.id"
      :job="job"
      @click="selectJob(job)"
      class="text-sm cursor-pointer border-l-2 transition-colors my-2"
      :class="[
        selectedJob && selectedJob.id === job.id
          ? 'border-primary bg-primary/10'
          : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
      ]"
    >
      <div class="flex gap-4">
        <UAvatar :src="job.company_logo" icon="i-heroicons-building-office-2" size="lg" />

        <div class="flex-1">
          <h3 class="font-semibold text-lg">{{ job.role }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ job.description }}</p>

          <div class="text-sm text-gray-600 mt-2">
            <p><strong>Company:</strong> {{ job.company_name }}</p>
            <p><strong>Workplace:</strong> {{ job.workplace }}</p>
            <p><strong>Deadline:</strong> {{ job.deadline }}</p>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <UBadge v-for="tag in job.tags" :key="tag" variant="soft">{{ tag }}</UBadge>
          </div>

          <div class="flex items-center justify-between text-sm text-gray-600 mt-4">
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-star-solid" class="text-yellow-400" />
              <span>{{ job.rating }}.00 || 5.00</span>
              <span v-if="job.verified" class="text-blue-500 ml-2">Project Verified</span>
            </div>
            <span>Proposals: <strong>{{ job.proposals }}</strong></span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import JobCardSkeleton from './JobCardSkeleton.vue'
import { useJobStore } from "~/stores/job"
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

interface Job {
  id: string;
  created_at: string;
  update_at: string;
  job_description: string;
  role: string;
  description: string;
  company_id: string;
  workplace: string;
  company_name: string;
  company_website: string;
  company_description: string;
  company_logo: string;
  link: string;
  deadline: string;
  tags: string[];
  rating: number;
  verified: boolean;
  proposals: number;
  // optional salary fields
  salary_min?: number;
  salary_max?: number;
}

//data
const jobStore = useJobStore()
const jobs = ref([])
const loading = ref(true)

const selectedJob = computed(() => {
  return jobStore.selectedJob
});

// computed filtered list based on filters prop
const filteredJobs = computed(() => {
  const f = props.filters || {}
  const company = (f.companyName || '').toString().toLowerCase().trim()
  const tags = Array.isArray(f.tags) ? f.tags : []
  const minSalary = f.salaryMin
  const maxSalary = f.salaryMax

  return (jobs.value || []).filter((job: any) => {
    // company name filter
    if (company) {
      if (!job.company_name || !job.company_name.toLowerCase().includes(company)) return false
    }
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
const selectJob = (job) => {
  if (jobStore.selectedJob && jobStore.selectedJob.id == job.id) {
    jobStore.selectedJob = {}
  } else {
    jobStore.selectedJob = job
  }
}

//hooks
onMounted(async()=>{
  loading.value = true
  try {
    const { data, error } = await $supabase.schema("jobs")
      .from('job_with_company_info')
      .select(`*`)
      .order('created_at', { ascending: false })
    if (error) throw error
    jobs.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>