<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked';
import axios from 'axios';
import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp()
const jobStore = useJobStore()
const searchQuery = ref('')
const loading = ref(false);
const filters = ref({});
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
const searchJobs = async() => {
  loading.value = true;
  jobStore.selectedJob = {};
  console.log("Search Jobs clicked", searchQuery.value);
  const { data, error } = await $supabase.schema("jobs")
      .from('job_with_company_info')
      .select('*')
      .or(`job_description.ilike.%${searchQuery.value}%,role.ilike.%${searchQuery.value}%,company_name.ilike.%${searchQuery.value}%`)
  if (error) {
    console.error("Error fetching jobs:", error);
    loading.value = false;
   
  } else {
    jobStore.jobList = data
    loading.value = false;
    // You can update your job list here with the fetched data  
  }
}

</script>

<template>
  <div>
   <div
      style="background-image: url('atj.jpeg');"
      class="bg-no-repeat bg-cover bg-bottom w-full h-[300px] flex justify-center items-center relative rounded-md overflow-hidden mb-6"
    >
      <div class="absolute inset-0 bg-black/10"></div>
      
      <div class="z-10 w-full max-w-4xl px-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          
          <div class="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
            <UInput
              v-model="searchQuery"
              size="xl"
              class="w-full"
              icon="i-heroicons-magnifying-glass-20-solid"
              placeholder="Search for jobs, companies..."
              :ui="{ rounded: 'rounded-full' }"
            />
            <UButton 
              @click="searchJobs"
              :loading="loading"
              loading-icon="i-lucide-loader"
              size="xl" 
              color="primary"
               variant="outline" 
              class="w-full md:w-auto px-8 rounded-full font-bold whitespace-nowrap"
            >
              Find Job
            </UButton>
          </div>
          
        

        </div>
      </div>
    </div>

    <!-- Filter Component -->
   <!-- <div class="my-6 flex justify-center">
      <div class="w-full max-w-xl">
        <JobFilter @change="handleFilterChange" />
      </div>
    </div> -->
    
    <!-- Dashboard area below the hero -->
    <div class="w-full flex gap-6 my-6" :class="{ 'justify-center': !selectedJob?.id }">
      <!-- keep the panel non-scrolling so JobCard's internal scroll works independently -->
      <UDashboardPanel
        class="transition-all duration-500"
        :resizable="!!selectedJob?.id"
        :min-size="22"
        :default-size="35"
        :max-size="40"
        :class="[!selectedJob?.id ? 'w-full max-w-3xl' : 'h-screen overflow-y-auto']"
      >
        <JobCard  :filters="filters"/>
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
