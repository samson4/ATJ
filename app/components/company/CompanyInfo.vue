<template>
  <UCard v-if="company">
    <template #header>
      <div class="flex items-center gap-4">
        <UAvatar :src="company.logo" :alt="company.name" size="lg" />
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ company.name }}</h1>
          <a :href="company.website" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-500 dark:text-primary-400 hover:underline">
            Visit Website
          </a>
        </div>
      </div>
    </template>

    <p class="text-gray-600 dark:text-gray-300">
      {{ company.description }}
    </p>
  </UCard>
  <!-- Loading Skeleton -->
  <div v-else >
    <div class="flex items-center gap-4">
      <USkeleton class="h-16 w-16 rounded-full" />
      <div class="space-y-2">
        <USkeleton class="h-5 w-32" />
        <USkeleton class="h-4 w-24" />
      </div>
    </div>
    <div class="space-y-2 mt-4">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-10/12" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  company: {
    type: Object,
    default: {},
  },
});

const company = props.company
</script>