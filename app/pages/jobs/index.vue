<script setup lang="ts">
import { ref, onMounted } from 'vue'
import JobDetail from '~/components/jobs/JobDetail.vue'

// Define a type for your job object for better TypeScript support
interface Job {
  title: string;
  description: string;
  icon: string;
  to: string;
  image: string;
}

const overlay = useOverlay()

// DON'T create the modal here anymore
// const modal = overlay.create(JobDetail) 

// MODIFY the function to accept the 'job'
async function openModal(job: Job) {
  // CREATE the modal here, passing the specific job as a prop
  // This assumes your overlay.create() accepts props as the second argument
  const modal = overlay.create(JobDetail, {
    job: job 
  })

  modal.open()
}

definePageMeta({ layout: 'default',middleware:"auth" })

const loading = ref(true)
// Explicitly type your jobs array
const jobs = ref<Job[]>([
  {
    title: 'Full Stack software developer',
    description: 'Nuxt UI integrates with Nuxt Icon to access over 200,000+ icons from Iconify.',
    icon: 'i-lucide-smile',
    to: '/docs/getting-started/integrations/icons',
    image: 'https://picsum.photos/seed/icons/300/200'
  },{
    title: 'Full Stack software developer',
    description: 'Nuxt UI integrates with Nuxt Icon to access over 200,000+ icons from Iconify.',
    icon: 'i-lucide-smile',
    to: '/docs/getting-started/integrations/icons',
    image: 'https://picsum.photos/seed/icons/400/200'
  },{
    title: 'Full Stack software developer',
    description: 'Nuxt UI integrates with Nuxt Icon to access over 200,000+ icons from Iconify.',
    icon: 'i-lucide-smile',
    to: '/docs/getting-started/integrations/icons',
    image: 'https://picsum.photos/seed/icons/400/200'
  }
  // ... other jobs
])
const steps ={
  "title" : "Start coding smarter in 3 steps",
  "description": "Transform your development workflow with our AI-powered assistant",
  "items":[
    {"title": "Connect Your IDE",
      "description": "Seamlessly integrate with VS Code, JetBrains, or your preferred editor. Get started in under 2 minutes with zero configuration needed.",
      "image":{
        "light": '/images/light/connect.svg',
        "dark": '/images/dark/connect.svg'
      }
    },
     {"title": "Track & Analyze",
      "description": "Our AI silently monitors your coding patterns to identify your peak productivity hours and potential workflow bottlenecks.",
      "image":{
        "light": '/images/light/optimize.svg',
        "dark": '/images/dark/optimize.svg'
      }
    },
     {"title":" Optimize & Code Smarter",
      "description": "Receive personalized recommendations to enhance your coding efficiency. Watch your productivity soar with data-driven insights.",
      "image":{
        "light": '/images/light/track.svg',
        "dark": '/images/dark/track.svg'
      }
    }
      ]

}
onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 800)
})
</script>

<template>
  <div class="w-full">
    <!-- Loading skeleton grid -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <div v-for="i in 8" :key="i">
        <UPageCard class="p-4">
          <div class="flex items-center gap-4">
            <USkeleton class="h-12 w-12 rounded-full" />
            <div class="flex-1">
              <USkeleton class="h-4 w-3/4 mb-2" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-5/6" />
            <USkeleton class="h-3 w-2/3" />
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Real content -->
<!-- <div class="w-full"> -->
    <div v-else>
      <div class="flex flex-row justify-center">

        <UInput

          class="w-100 h-50 align-center"
          icon="i-lucide-search"
          placeholder="Search jobs."
        
        />
        </div>
      
      
      <UPageGrid>
        <UCard
          v-for="(job, index) in jobs"
          :key="index"
        >
          <!-- <template #header>
            <img :src="job.image" class="w-full h-48 object-cover rounded-t-lg" :alt="job.title" />
          </template> -->

          <div>
            <h3 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{{ job.title }}</h3>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">{{ job.description }}</p>
          </div>
          
          <template #footer>
            <UButton
              @click="openModal(job)" 
              icon="i-heroicons-arrow-right-20-solid" 
              trailing 
              color="primary" 
              variant="solid"
            >
              Read more
            </UButton>
          </template>
        </UCard>
      </UPageGrid>
          <!-- <UPageSection
      id="steps"
      :description="steps.description"
      class="relative overflow-hidden"
    >
      <template #headline>
        <UColorModeImage
          light="/images/light/line-3.svg"
          dark="/images/dark/line-3.svg"
          class="absolute -top-10 sm:top-0 right-1/2 h-24"
        />
      </template>
      <template #title>
        <MDC :value="steps.title" />
      </template>

      <template #features>
        <UPageCard
          v-for="(step, index) in steps.items"
          :key="index"
          class="group"
          :ui="{ container: 'p-4 sm:p-4', title: 'flex items-center gap-1' }"
        >
          <UColorModeImage
            v-if="step.image"
            :light="step.image?.light"
            :dark="step.image?.dark"
            :alt="step.title"
            class="size-full"
          />

          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">
              {{ step.title }}
            </span>
            <span class="text-sm text-muted">
              {{ step.description }}
            </span>
          </div>
        </UPageCard>
      </template>
    </UPageSection> -->
    </div>
  </div>
  <!-- </div> -->
</template>