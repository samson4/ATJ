<script setup lang="ts">
import { ref, computed } from 'vue'
import { sub, format, isSameDay } from 'date-fns' // formatting tools
import { useJobStore } from "~/stores/job"

const { $supabase } = useNuxtApp()
const jobStore = useJobStore()

// --- State ---
const searchQuery = ref('')
const loading = ref(false)

// --- Filter Selections ---
// 1. Initialize with a range object for UCalendar
const dateRange = shallowRef([])
const selectedWorkplace = ref([])
const selectedType = ref([])
const selectedTag = ref([])
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

// --- Computed Helpers ---

// 2. Computed Label for the Button (e.g. "Jan 10 - Jan 20")
const dateLabel = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) {return 'Anytime'}
  
  const startStr = format(dateRange.value.start, 'd MMM, yyyy')
  const endStr = dateRange.value.end ? format(dateRange.value.end, 'd MMM, yyyy') : ''
  
  if (!dateRange.value.end || isSameDay(dateRange.value.start, dateRange.value.end)) {
    return startStr
  }
  return `${startStr} - ${endStr}`

})



const selectedJob = computed(() => jobStore.selectedJob)

definePageMeta({ layout: 'default' })

// --- Methods ---

const searchJobs = async () => {
  loading.value = true;
  jobStore.selectedJob = {};

  let query: any = $supabase
    .schema("jobs")
    .from('job_with_company_info')
    .select('*')
    .order('created_at', { ascending: false });

  // Text Search
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    query = query.or(`job_description.ilike.%${searchQuery.value}%,role.ilike.%${searchQuery.value}%,company_name.ilike.%${searchQuery.value}%`)
  }

  // 3. Date Filter Logic (Updated for Range)
  if (dateRange.value.start) {
    const startIso = new Date(dateRange.value.start).toISOString()
    query = query.gte('created_at', startIso)
    
    // If we have an end date, set it to the very end of that day (23:59:59)
    if (dateRange.value.end) {
      const endDate = new Date(dateRange.value.end)
      endDate.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endDate.toISOString())
    }else {
      // If no end date, just use the start date as a single day filter
      const endOfDay = new Date(dateRange.value.start)
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
</script>

<template>
  <div>
    <div
      style="background-image: url('atj.jpeg');"
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
              
              <UPopover :popper="{ placement: 'bottom-start' }">

                 


                <UButton  label="Date Posted" color="neutral" variant="outline">
                  <UIcon name="i-heroicons-calendar-days-20-solid" class="text-center text-gray-700 dark:text-gray-200 font-normal"/>
                  <span class="text-center ml-2 text-gray-700 dark:text-gray-200 font-normal">
                    {{ dateLabel }}
                  </span>
                  <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-2 text-gray-500"/>
                </UButton>
        
                <template #content>
                  <div class="p-2">
                    <UCalendar range v-model="dateRange"  />
                  </div>
                  
                  <div class="flex justify-end p-2 border-t border-gray-200 dark:border-gray-700 gap-2">
                    <UButton size="xs" color="error" variant="ghost" @click="dateRange = []; searchJobs()">
                      Cancel
                    </UButton>
                    <UButton size="xs" color="primary" @click="searchJobs()">
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
                  dateRange = [];
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
    
    <div class="w-full flex gap-6 my-6" :class="{ 'justify-center': !selectedJob?.id }">
      <UDashboardPanel
        class="transition-all duration-500"
        :resizable="!!selectedJob?.id"
        :min-size="22"
        :default-size="35"
        :max-size="40"
        :class="[!selectedJob?.id ? 'w-full max-w-3xl' : 'h-screen overflow-y-auto']"
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
  </div>
</template>