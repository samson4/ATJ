<script setup lang="ts">
import { useJobStore } from "~/stores/job"

const jobStore = useJobStore()

const selectedJob = computed(() => {
  return jobStore.selectedJob
});

</script>

<template>
  <UCard :ui="{ body: { padding: 'sm:p-6' } }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UAvatar icon="i-heroicons-building-office-2" size="lg" />
        <div>
          <span class="text-sm text-gray-500">ELITE LIMITED</span>
          <h2 class="text-xl font-bold">{{ selectedJob.title }}</h2>
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
      <p class="text-gray-600">
        {{ selectedJob.description }}
      </p>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Skills</h3>
      <div class="flex flex-wrap gap-2" v-for="tag in selectedJob.tags" :key="tag">
        <UBadge variant="soft">{{ tag }}</UBadge>
        
      </div>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Detail Project</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-500">Rating</div>
          <div class="font-medium">{{  selectedJob.proposals }}</div>
        </div>
        <div>
          <div class="text-gray-500">28 success project</div>
          <div class="font-medium text-blue-500">{{ selectedJob.verified }}</div>
        </div>
        <div>
          <div class="text-gray-500">$60k+ total spent</div>
          <div class="font-medium text-blue-500">Payment Verified</div>
        </div>
      </div>
    </div>

    <USeparator class="my-6" />

    <UInput
      value="https://jobored.com/job/lfffsy78"
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

    <UButton block size="lg" class="mt-6"> Submit a Proposal </UButton>
  </UCard>
</template>
