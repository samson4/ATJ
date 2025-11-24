<script setup lang="ts">
import { marked } from 'marked';
import { useJobStore } from "~/stores/job"

const jobStore = useJobStore()

const selectedJob = computed(() => {
  return jobStore.selectedJob
});

</script>

<template>
  <UCard :ui="{ body: { padding: 'sm:p-6' } }" class="h-[calc(100vh-10rem)] overflow-y-auto">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UAvatar :src="selectedJob.company_logo" icon="i-heroicons-building-office-2" size="lg" />
        <div>
          <NuxtLink :to="`/company/${selectedJob.company_id}`" class="text-sm text-gray-500">{{ selectedJob.company_name }}</NuxtLink>
          <h2 class="text-xl font-bold">{{ selectedJob.role }}</h2>
        </div>
      </div>
      <UButton
        icon="i-heroicons-bookmark"
        color="neutral"
        variant="outline"
        size="lg"
      />
    </div>

    <USeparator class="my-6" />

    <div class="space-y-2">
      <h3 class="text-lg font-semibold">Project Overview</h3>
      
        <div v-html="marked.parse(selectedJob.job_description)"></div>
     
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Skills</h3>
      <div class="flex flex-wrap gap-2">
        <UBadge v-for="tag in selectedJob.tags" :key="tag" variant="soft">{{ tag }}</UBadge>
      </div>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Project Details</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-500">Rating</div>
          <div class="font-medium">{{ selectedJob.rating }} / 5</div>
        </div>
        <div>
          <div class="text-gray-500">Verified</div>
          <div class="font-medium text-blue-500">{{ selectedJob.verified ? 'Yes' : 'No' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Workplace</div>
          <div class="font-medium">{{ selectedJob.workplace }}</div>
        </div>
        <div>
          <div class="text-gray-500">Deadline</div>
          <div class="font-medium">{{ selectedJob.deadline }}</div>
        </div>
      </div>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Company Website</h3>
      <UInput
        :value="selectedJob.company_website"
        readonly
        :ui="{ icon: { trailing: { pointer: '' } } }"
      >
        <template #trailing>
          <UButton
            icon="i-heroicons-clipboard-document"
            variant="ghost"
            color="secondary"
          />
        </template>
      </UInput>
    </div>

    <UButton block size="lg" class="mt-6"> Submit a Proposal </UButton>
  </UCard>
</template>
