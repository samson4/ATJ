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

const filters = ref({})

const handleFilterChange = (newFilters: any) => {
  filters.value = newFilters
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
  <div>
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

    <!-- Filter Component -->
   <!-- <div class="my-6 flex justify-center">
      <div class="w-full max-w-xl">
        <JobFilter @change="handleFilterChange" />
      </div>
    </div> -->
    
    <!-- Dashboard area below the hero -->
    <div class="w-full flex gap-6" :class="{ 'justify-center': !selectedJob?.id }">
      <!-- keep the panel non-scrolling so JobCard's internal scroll works independently -->
      <UDashboardPanel
        class="transition-all duration-500"
        :resizable="!!selectedJob?.id"
        :min-size="22"
        :default-size="35"
        :max-size="40"
        :class="[!selectedJob?.id ? 'w-full max-w-3xl' : 'h-[calc(100vh-10rem)] overflow-y-auto']"
      >
        <JobCard :filters="filters" />
      </UDashboardPanel>

      <Transition
        enter-active-class="transition-opacity duration-500"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-500"
        leave-to-class="opacity-0"
      >
        <div v-if="selectedJob && selectedJob.id" class="flex-1">
          <JobDetail @close="selectedJob = null" />
        </div>
      </Transition>
    </div>

    <!-- Mobile slide over -->
    <ClientOnly>
      <USlideover v-if="isMobile && selectedJob && selectedJob.id">
        <template #content>
          <JobDetail @close="selectedJob = null" />
        </template>
      </USlideover>
    </ClientOnly>
  </div>
</template>
