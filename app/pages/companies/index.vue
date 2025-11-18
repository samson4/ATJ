<template>
  <div class="space-y-4">
    <UTabs :items="tabItems" />
    <UPageGrid>
      <div class="space-y-4">
      <JobCard v-for="job in jobs" :key="job.id" :job="job" />
    </div>
    <JobDetail/>
    </UPageGrid>
  </div>
</template>

<script setup>
const tabItems = [
  { label: 'Best Matches' },
  { label: 'Featured' },
  { label: 'Most Recent' }
]

// Dummy data for the job list
const jobs = ref([
  {
    id: 1,
    title: 'Figma Designer',
    description: 'We are looking for figma designers who can help...',
    tags: ['UI Designer', 'Figma', 'Landing Page'],
    proposals: '10 to 15',
    verified: true,
    rating: 5
  },
  {
    id: 2,
    title: 'Vue.js Developer',
    description: 'Looking for an experienced Vue.js developer...',
    tags: ['Vue.js', 'Nuxt', 'JavaScript'],
    proposals: '5 to 10',
    verified: true,
    rating: 5
  },
  {
    id: 3,
    title: 'Backend Engineer',
    description: 'Need a backend engineer for a Python/Django project...',
    tags: ['Python', 'Django', 'API'],
    proposals: '15 to 20',
    verified: false,
    rating: 4
  }
])
</script>