<template>
  <UCard @click="selectJob(job)"
  class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
   :class="[
         
          selectedJob && selectedJob.id === job.id
            ? 'border-primary bg-primary/10'
            : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
        ]">
    <div    class="flex gap-4">
      <UAvatar icon="i-heroicons-building-office-2" size="lg" />

      <div class="flex-1">
        <h3 class="font-semibold text-lg">{{ job.title }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ job.description }}</p>

        <div class="flex flex-wrap gap-2 mt-3">
          <UBadge v-for="tag in job.tags" :key="tag" variant="soft">{{ tag }}</UBadge>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-600 mt-4">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-star-solid" class="text-yellow-400" />
            <span>{{ job.rating }}.00</span>
            <span vif="job.verified" class="text-blue-500 ml-2">Project Verified</span>
          </div>
          <span>Proposals: <strong>{{ job.proposals }}</strong></span>
        </div>
      </div>
    </div>
    
    <UButton
      icon="i-heroicons-bookmark"
      color="neutral"
      variant="outline"
      class="absolute top-2 right-2"
    />
  </UCard>
</template>

<script setup>
import { useJobStore } from "~/stores/job"
const props = defineProps({
  job: {
    type: Object,
    required: true
  }
})
//data
const jobStore = useJobStore()

// const selectedJob = jobStore.selectedJob

const selectedJob = computed(() => {
  return jobStore.selectedJob
});

//methods

const selectJob = (job)=>{
  
  jobStore.selectedJob = job
}

</script>