<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked';

import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp()
const jobStore = useJobStore()
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



const selectedJob = computed(() => {
  return jobStore.selectedJob
});
definePageMeta({ layout: 'default' })

//methods
const openDetail = ()=>{
  console.log("open detail called")
}
const tabItems = [
  { label: 'Best Matches' },
  { label: 'Featured' },
  { label: 'Most Recent' }
]
</script>

<template>
 
    <div
      style="background-image: url('atj.jpeg'); height: 300px; background-size: cover; background-position: bottom;"
      class="bg-no-repeat w-full flex justify-center rounded-md "
    >
      <UInput
        size="xl"
        class="w-full max-w-3xl"
        icon="i-lucide-search"
        placeholder="Search jobs."
      />
    </div>
    <!-- A basic filter component based on job tag, company name and salary range -->
     
    <!-- Dashboard area below the hero -->
    <div class="w-full flex gap-6 ">
      <!-- keep the panel non-scrolling so JobCard's internal scroll works independently -->
      <UDashboardPanel class="h-full overflow-hidden" resizable :min-size="22" :default-size="35" :max-size="40">
        <JobCard />
      </UDashboardPanel>

      <!-- Right column: JobDetail or placeholder -->
      <div class="flex-1">
        <JobDetail v-if="selectedJob && selectedJob.id" @close="selectedJob = null" />
        <div v-else class="hidden lg:flex flex-1 items-center justify-center"></div>
      </div>
    </div>

    <!-- Mobile slide over -->
    <ClientOnly>
      <USlideover v-if="isMobile">
        <template #content>
          <JobDetail v-if="selectedJob && selectedJob.id" @close="selectedJob = null" />
        </template>
      </USlideover>
    </ClientOnly>

</template>