<template>
  <UCard
    v-for="job in jobs" :key="job.id" :job="job"
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
</template>

<script setup lang="ts">
import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp()
const props = defineProps({
  job: {
    type: Object,
    required: true
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
}

//data
const jobStore = useJobStore()
const jobs = ref([
 
])
// const selectedJob = jobStore.selectedJob

const selectedJob = computed(() => {
  return jobStore.selectedJob
});

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
const { data, error } = await $supabase.schema("jobs")
  .from('job_with_company_info')
  .select(`
    *
  `)
  .order('created_at', { ascending: false })
  if (error) throw error
  jobs.value = data
})
</script>