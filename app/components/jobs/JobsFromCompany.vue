<script setup lang="ts">
import { ref, onMounted } from 'vue'
import JobDetail from '~/components/jobs/JobDetail.vue'

// Define a type for your job object for better TypeScript support
interface Job {
  id:string;
  created_at: string;
  update_at:string;
  job_description:string;
  role: string;
  description: string;
  company_id: string;
  workplace:string;
  company_name:string;
  company_website:string;
  company_description:string;
  company_logo: string;
  link: string;
  deadline:string;
}

const overlay = useOverlay()

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
    jobs.value = data
  }
  loading.value = false
})
</script>

<template>
  <div>
    <!-- Loading skeleton grid -->
    <div v-if="loading" >
      <UCard v-for="i in 3" :key="i">
        <div >
          <USkeleton class="h-5 w-1/2" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-2/3" />
        </div>
      </UCard>
    </div>

    <!-- Real content -->
    <div v-else>
      <div v-if="jobs.length === 0">
        <p>No open positions at this company.</p>
      </div>
      <UCard
        v-for="(job, index) in jobs"
        :key="index"
        v-else
        class="my-4"
      >
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ job.role }}</h2>
        </template>

        <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">{{ job.job_description.slice(0,200) + "..." }}</p>

        <template #footer>
          <JobsJobDetail :job="job"/>
        </template>
      </UCard>
    </div>
  </div>
</template>