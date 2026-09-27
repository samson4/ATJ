<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { useJobStore } from "~/stores/job"

const { $supabase } = useNuxtApp()
const jobStore = useJobStore()
const route = useRoute()


const { data: page } = await useAsyncData('index', () => {
  return queryCollection('content').first()
})
console.log("page",page)

// --- State ---
const searchQuery = useState<string>('job-browser-search-query', () => '')
const loading = ref(false)
const dateFilterOpen = ref(false)

// --- Filter Selections ---
type StoredDateRange = {
  start?: string
  end?: string
}

const dateRange = useState<StoredDateRange>('job-browser-date-range', () => ({}))
const selectedWorkplace = useState<any[]>('job-browser-workplace', () => [])
const selectedType = useState<any[]>('job-browser-type', () => [])
const selectedTag = useState<any[]>('job-browser-tags', () => [])
// --- Options Configuration ---
const workplaceOptions = [
  { label: 'Remote', value: 'Remote' },
  { label: 'On-site', value: 'On Site' },
  { label: 'Hybrid', value: 'Hybrid' }
]

const typeOptions = [
  { label: 'Permanent', value: 'Permanent' },
  { label: 'Contractual', value: 'Contractual' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Consultant', value: 'Consultant' }
]

const TagOptions = [
  { label: 'Java', value: 'Java' },
  { label: 'Python', value: 'Python' },
  { label: 'JavaScript', value: 'JavaScript' },
  { label: 'React', value: 'React' },
  { label: 'Vue', value: 'Vue' },
  { label: 'Node.js', value: 'Node.js' },
  { label: '.NET', value: '.NET' },
  { label: 'SQL', value: 'SQL' },
  { label: 'NoSQL', value: 'NoSQL' },
  { label: 'AWS', value: 'AWS' },
  { label: 'Azure', value: 'Azure' },
  { label: 'Docker', value: 'Docker' },
  { label: 'Kubernetes', value: 'Kubernetes' },
  { label: 'Agile', value: 'Agile' },
  { label: 'Scrum', value: 'Scrum' },
  { label: 'DevOps', value: 'DevOps' },
  { label: 'Full-Stack', value: 'Full-Stack' },
  { label: 'Front-End', value: 'Front-End' },
  { label: 'Back-End', value: 'Back-End' },
  { label: 'Data Science', value: 'Data Science' }
]

// Keep Nuxt state serializable while adapting it to UCalendar's DateValue model.
const timeZone = getLocalTimeZone()

const toDateKey = (value: unknown) => {
  if (!value) return undefined

  if (typeof value === 'string') {
    return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const dateValue = value as Partial<DateValue>
  if (dateValue.year && dateValue.month && dateValue.day) {
    return `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`
  }

  return undefined
}

const toCalendarDate = (value: unknown) => {
  const dateKey = toDateKey(value)
  if (!dateKey) return undefined

  try {
    return parseDate(dateKey)
  } catch {
    return undefined
  }
}

const calendarDateRange = computed<DateRange | null>({
  get: () => ({
    start: toCalendarDate(dateRange.value?.start),
    end: toCalendarDate(dateRange.value?.end)
  }),
  set: (value) => {
    dateRange.value = {
      start: toDateKey(value?.start),
      end: toDateKey(value?.end)
    }
  }
})

const dateLabel = computed(() => {
  const startKey = toDateKey(dateRange.value?.start)
  const endKey = toDateKey(dateRange.value?.end)
  const startDate = toCalendarDate(startKey)?.toDate(timeZone)

  if (!startKey || !startDate) return 'Anytime'

  const startLabel = format(startDate, 'd MMM, yyyy')
  const endDate = toCalendarDate(endKey)?.toDate(timeZone)
  if (!endKey || !endDate || startKey === endKey) return startLabel

  return `${startLabel} - ${format(endDate, 'd MMM, yyyy')}`
})

const selectedJob = computed(() => jobStore.selectedJob)
const isMobile = ref(false)
const jobListPanel = ref<HTMLElement | null>(null)
const savedWindowScrollY = useState<number>('job-browser-window-scroll-y', () => 0)
const savedListScrollTop = useState<number>('job-browser-list-scroll-top', () => 0)
let mobileMediaQuery: MediaQueryList | null = null

const rememberListScrollPosition = () => {
  if (jobListPanel.value) {
    savedListScrollTop.value = jobListPanel.value.scrollTop
  }
}

const rememberScrollPosition = () => {
  savedWindowScrollY.value = window.scrollY
  rememberListScrollPosition()
}

const restoreScrollPosition = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedWindowScrollY.value })

      if (jobListPanel.value) {
        jobListPanel.value.scrollTop = savedListScrollTop.value
      }
    })
  })
}

const syncMobileView = () => {
  isMobile.value = mobileMediaQuery?.matches ?? false
}

const jobDetailDrawerOpen = computed({
  get: () => !!selectedJob.value?.id,
  set: (open) => {
    if (!open) {
      jobStore.selectedJob = {}
      if (route.params.id) {
        navigateTo({ path: '/', query: route.query })
      }
    }
  }
})

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  syncMobileView()
  mobileMediaQuery.addEventListener('change', syncMobileView)
  restoreScrollPosition()
})

onBeforeUnmount(() => {
  rememberScrollPosition()
  mobileMediaQuery?.removeEventListener('change', syncMobileView)
})

// --- Methods ---

const searchJobs = async () => {
  loading.value = true;

  let query: any = $supabase
    .schema("jobs")
    .from('job_with_company_info')
    .select('*')
    .order('created_at', { ascending: false });

  // Text Search
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    query = query.or(`job_description.ilike.%${searchQuery.value}%,role.ilike.%${searchQuery.value}%,company_name.ilike.%${searchQuery.value}%`)
  }

  // Date Filter
  const startDate = toCalendarDate(dateRange.value?.start)?.toDate(timeZone)
  const endDate = toCalendarDate(dateRange.value?.end)?.toDate(timeZone)

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())

    if (endDate) {
      const endOfRange = new Date(endDate)
      endOfRange.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endOfRange.toISOString())
    } else {
      const endOfDay = new Date(startDate)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endOfDay.toISOString())
    }
  }

  // Workplace Filter
  if (selectedWorkplace.value.length > 0) {
     const wpValues = selectedWorkplace.value.map((i: any) => i.value || i)
     query = query.in('workplace', wpValues)
  }

  // Employment Type Filter
  if (selectedType.value.length > 0) {
     const typeValues = selectedType.value.map((i: any) => i.value || i)
     query = query.in('employment_type', typeValues)
  }
  
  // Tag Filter
//   if (selectedTag.value.length > 0) {
//   const tagValues = selectedTag.value.map((i: any) => i.value || i);
  
//   // ✅ FIX: Use .contains() instead of .filter()
//   // This performs a "tags @> tagValues" query (Match ALL selected tags)
//   query = query.contains('tags', tagValues); 
// }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
  } else {
    jobStore.jobList = data;
  }
  loading.value = false;
}

const applyDateFilter = async () => {
  await searchJobs()
  dateFilterOpen.value = false
}

const cancelDateFilter = async () => {
  dateRange.value = {}
  // await searchJobs()
  dateFilterOpen.value = false
}
</script>

<template>
  <div>
  <UPageHero
    class="hidden md:block"
    :title="page?.title"
    :description="page?.description"
  />
    <div
      style="background-image: url('/atj.jpeg');"
      class="bg-no-repeat bg-cover bg-bottom w-full h-[350px] flex justify-center items-center relative rounded-md overflow-hidden mb-6"
    >
      <div class="absolute inset-0 bg-black/10"></div>
      
      <div class="z-10 w-full max-w-5xl px-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden py-4">
          
          <div class="px-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center">
            <UInput
              v-model="searchQuery"
              size="xl"
              class="w-full"
              icon="i-heroicons-magnifying-glass-20-solid"
              placeholder="Search for jobs, companies..."
              :ui="{ rounded: 'rounded-full', icon: { trailing: { pointer: '' } } }"
              @keyup.enter="searchJobs"
            />
            <UButton 
              @click="searchJobs"
              icon="i-lucide-search"
              :loading="loading"
              loading-icon="i-lucide-loader"
              size="xl" 
              color="primary"
              class="w-full md:w-auto px-8 rounded-full font-bold whitespace-nowrap min-w-[140px] flex justify-center"
            >
              Find Job
            </UButton>
          </div>
          <div class="px-6 pt-3 flex flex-col">
            <div class="flex flex-wrap justify-center gap-4 w-full">
              
              <UPopover v-model:open="dateFilterOpen" :popper="{ placement: 'bottom-start' }">

                 


                <UButton  label="Date Posted" color="neutral" variant="outline">
                  <UIcon name="i-heroicons-calendar-days-20-solid" class="text-center text-gray-700 dark:text-gray-200 font-normal"/>
                  <span class="text-center ml-2 text-gray-700 dark:text-gray-200 font-normal">
                    {{ dateLabel }}
                  </span>
                  <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-2 text-gray-500"/>
                </UButton>
        
                <template #content>
                  <div class="p-2">
                    <UCalendar v-model="calendarDateRange" range />
                  </div>
                  
                  <div class="flex justify-end p-2 border-t border-gray-200 dark:border-gray-700 gap-2">
                    <UButton size="xs" color="error" variant="ghost" @click="cancelDateFilter">
                      Cancel
                    </UButton>
                    <UButton size="xs" color="primary" @click="applyDateFilter">
                      OK
                    </UButton>
                  </div>
                </template>
              </UPopover>
              <USelectMenu 
                v-model="selectedType" 
                :items="typeOptions" 
                @change="searchJobs()"
                multiple 
                size="sm"
                placeholder="Type"
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-100' }"
              >
                <template #default="{ open }">
                  <UButton color="neutral" variant="ghost">
                    <UIcon name="i-heroicons-briefcase" class="w-4 h-4 text-gray-500" />
                    <span class="text-gray-700 dark:text-gray-200 font-normal">
                      {{ selectedType.length ? `${selectedType.length} Selected` : 'Job Type' }}
                    </span>
                  </UButton>
                </template>
              </USelectMenu>

              <!-- <USelectMenu 
                v-model="selectedTag" 
                :items="TagOptions" 
                @change="searchJobs()"
                multiple 
                size="md"
                placeholder="Tags"
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-100' }"
              >
                <template #default="{ open }">
                  <UButton color="neutral" variant="ghost">
                    <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-gray-500" />
                    <span class="text-gray-700 dark:text-gray-200 font-normal">
                       {{ selectedTag.length ? `${selectedTag.length} Tags` : 'Tag' }}
                    </span>
                  </UButton>
                </template>
              </USelectMenu> -->

               <USelectMenu 
                v-model="selectedWorkplace" 
                :items="workplaceOptions" 
                @change="searchJobs()"
                size="sm"
                multiple 
                :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-100' }"
              >
                <template #default="{ open }">
                  <UButton color="neutral" variant="ghost">
                    <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-500" />
                    <span class="text-gray-700 dark:text-gray-200 font-normal">
                       {{ selectedWorkplace.length ? `${selectedWorkplace.length} Types` : 'Workplace' }}
                    </span>
                  </UButton>
                </template>
              </USelectMenu>
              <!-- clear filters  -->
              <UButton 
                v-if="dateRange.start || dateRange.end || selectedWorkplace.length || selectedType.length || selectedTag.length || searchQuery"
                color="error" 
                icon="i-lucide-x"
                 variant="outline"
                size="sm"
                ui="{  }" 
                @click="
                  dateRange = {};
                  selectedWorkplace = [];
                  selectedType = [];
                  selectedTag = [];
                  searchQuery = '';
                  searchJobs();
                "
              >
                Clear Filters
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="w-full md:flex gap-6 my-6" :class="{ 'md:justify-center': !selectedJob?.id }">
      <UDashboardPanel
        class="transition-all duration-500"
        :resizable="!!selectedJob?.id"
        :min-size="22"
        :default-size="35"
        :max-size="40"
        :class="[
          !selectedJob?.id ? 'w-full md:max-w-3xl' : 'w-full',
          'md:h-screen'
        ]"
      >
        <div
          ref="jobListPanel"
          class="w-full md:min-h-0 md:flex-1 md:overflow-y-auto md:px-1 [scrollbar-gutter:stable]"
          @scroll.passive="rememberListScrollPosition"
        >
          <JobCard />
        </div>
      </UDashboardPanel>

      <Transition
        enter-active-class="transition-opacity duration-500"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-500"
        leave-to-class="opacity-0"
      >
        <div v-if="selectedJob && selectedJob.id" class="hidden md:block flex-1">
          <JobDetail />
        </div>
      </Transition>
    </div>

    <ClientOnly>
      <UDrawer
        v-if="isMobile"
        v-model:open="jobDetailDrawerOpen"
        title="Job details"
        close-icon="i-lucide-x"
        :close="{
          color: 'primary',
          variant: 'outline',
          class: 'rounded-full'
        }"
        :dismissible="false"
        :handle="false"
        :ui="{
          content: 'h-[88dvh] max-h-[88dvh]',
          container: 'h-full min-h-0 gap-0 overflow-hidden p-0',
          header: 'border-b border-muted px-4 py-3',
          body: 'min-h-0 flex-1 overflow-y-auto p-0'
        }"
      >
        <template #body>
          <JobDetail v-if="selectedJob?.id" :full-height="false" />
        </template>
      </UDrawer>
    </ClientOnly>
  </div>
</template>
