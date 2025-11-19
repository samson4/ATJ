<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked';
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
  deadline:string
}

definePageMeta({ layout: 'default',middleware:"auth" })

const { $supabase } = useNuxtApp()


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
const loading = ref(true)
// Explicitly type your jobs array
const jobs = ref<Job[]>([
])
onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 800)
})
</script>

<template>
  <div >
    <!-- Loading skeleton grid -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <div v-for="i in 8" :key="i">
        <UPageCard class="p-4">
          <div class="flex items-center gap-4">
            <USkeleton class="h-12 w-12 rounded-full" />
            <div class="flex-1">
              <USkeleton class="h-4 w-3/4 mb-2" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-5/6" />
            <USkeleton class="h-3 w-2/3" />
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Real content -->
<!-- <div class="w-full"> -->
    <div v-else>
      <div
  style="background-image: url('atj.jpeg'); height: 300px; background-size: cover; background-position: bottom;"
  class="bg-no-repeat flex flex-row justify-center  rounded-md"
>
  <UInput
    size="xl"
    
    class="w-full max-w-3xl"
    icon="i-lucide-search"
    placeholder="Search jobs."
  />
</div>
      
      
      <UPageGrid class="m-6">
  <UCard
    v-for="(job, index) in jobs"
    :key="index"
  >
    <!-- Card Header -->
    <template #header>
      <NuxtLink :to="`/company/${job.company_id}`">
        <h2 class="text-success">{{ job.company_name }}</h2>
      </NuxtLink>
    </template>

    <!-- Card Body -->
    <div class="h-40">
      <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {{ job.role }}
      </h3>
      
      <div v-html="marked.parse(job.job_description.slice(0, 200) + '...')"></div>

    </div>

    <!-- Card Footer -->
    <template #footer>
      <JobsJobDetail :job="job" />
    </template>
  </UCard>
</UPageGrid>
    </div>
  </div>
  <!-- </div> -->
</template>