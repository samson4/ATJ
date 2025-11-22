<template>

    <UDashboardPanel class="border-none"  resizable :min-size="22" :default-size="35" :max-size="40">
      
      <JobCard class="overflow-y-auto"   />
  </UDashboardPanel>

   <JobDetail  v-if="selectedJob && selectedJob.id"  @close="selectedJob = null" />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    
  </div>

    <ClientOnly>
    <USlideover v-if="isMobile">
      <template #content>
        <JobDetail v-if="selectedJob && selectedJob.id"  @close="selectedJob = null" />
      </template>
    </USlideover>
  </ClientOnly>
</template>

<script setup>
import { useJobStore } from "~/stores/job"
const { $supabase } = useNuxtApp()
const jobStore = useJobStore()

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


// Dummy data for the job list

</script>