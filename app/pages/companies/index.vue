<template>
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
      <JobCard />
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

  <ClientOnly>
    <USlideover v-if="isMobile && selectedJob && selectedJob.id">
      <template #content>
        <JobDetail @close="selectedJob = null" />
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