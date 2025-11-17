<template>
  <div class="space-y-4">
    <UTabs :items="tabItems" />
    <UPageGrid>
      <div class="space-y-4">
      <JobCard v-for="job in jobs" :key="job.id" :job="job" />
    </div>
        <template>
  <UCard :ui="{ body: { padding: 'sm:p-6' } }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UAvatar icon="i-heroicons-building-office-2" size="lg" />
        <div>
          <span class="text-sm text-gray-500">ELITE LIMITED</span>
          <h2 class="text-xl font-bold">Figma Designer</h2>
        </div>
      </div>
      <UButton icon="i-heroicons-bookmark" color="gray" variant="ghost" size="lg" />
    </div>

    <USeparator class="my-6" />

    <div class="space-y-2">
      <h3 class="text-lg font-semibold">Project Overview</h3>
      <p class="text-gray-600">
        Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
      </p>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Skills</h3>
      <div class="flex flex-wrap gap-2">
        <UBadge variant="soft">UI/UX Designer</UBadge>
        <UBadge variant="soft">Figma</UBadge>
        <UBadge variant="soft">Landing Page</UBadge>
      </div>
    </div>

    <USeparator class="my-6" />

    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Detail Project</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-500">Rating</div>
          <div class="font-medium">5.00 of 48 reviews</div>
        </div>
        <div>
          <div class="text-gray-500">28 success project</div>
          <div class="font-medium text-blue-500">Project Verified</div>
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
        <UButton icon="i-heroicons-clipboard-document" variant="ghost" color="secondary" />
      </template>
    </UInput>
    
    <UButton block size="lg" class="mt-6">
      Submit a Proposal
    </UButton>

  </UCard>
</template>
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