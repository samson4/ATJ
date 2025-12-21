<script setup lang="ts">
import { marked } from 'marked';
import { useJobStore } from "~/stores/job";
import { computed } from 'vue';
import type { Job } from '~/interfaces/jobInterface'

const jobStore = useJobStore();
const selectedJob = computed<Job>(() => jobStore.selectedJob || ({} as Job));

// helpers
const formatMoney = (value?: number | null) => {
  if (value == null) return '—';
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
};

const hasSalary = (j: Job) => j?.salary_min != null || j?.salary_max != null;

const visibleTags = (j: Job) => (j?.tags || []).slice(0, 5);
const extraTagCount = (j: Job) => Math.max(0, (j?.tags?.length || 0) - 5);

const formatDate = (d?: string | null) => {
  if (!d) return ''
 
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return d
  }
}
const timeAgo = (d?: string | null) => {
  if (!d) return 'unknown';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

const applyLink = computed(() => {
  const link = selectedJob.value?.link;
  if (!link) return undefined;
  if (link.startsWith('mailto:')) return link;
  if (link.includes('@') && !link.startsWith('mailto:')) return `mailto:${link}`;
  return link;
});
</script>

<template>
  <UCard :ui="{ body: { padding: 'sm:p-6' } }" class="h-screen overflow-y-auto">
    <!-- Header -->
     <template #header>
      
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UAvatar :src="selectedJob.company_logo" icon="i-heroicons-building-office-2" size="lg" />
        <div>
          <NuxtLink v-if="selectedJob.company_id" :to="`/company/${selectedJob.company_id}`" class="text-sm text-primary-600 font-medium hover:underline">
            {{ selectedJob.company_name || 'Company' }}
          </NuxtLink>
          <h2 class="text-xl font-bold mt-1">{{ selectedJob.role || selectedJob.title || 'Untitled Role' }}</h2>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ selectedJob.short_description || selectedJob.description }}</p>
           <div class="flex items-center gap-2">
            
          <UBadge icon="i-heroicons-map-pin" size="md" variant="outline" v-if="selectedJob.workplace" color="neutral">{{ (selectedJob.workplace || '').toString().replace(/^\w/, c => c.toUpperCase()) }}</UBadge>
          
          <UBadge  v-if="hasSalary(selectedJob)" color="primary" variant="solid" >
            
            {{ formatMoney(selectedJob.salary_min) }} - {{ formatMoney(selectedJob.salary_max) }}
          </UBadge>
          
        </div>
        </div>
      </div>

      <div class="flex-shrink-0 flex flex-col items-end gap-3">
         <div class="mt-6">
      <UButton
        v-if="applyLink"
        :to="applyLink"
        :target="applyLink && !applyLink.startsWith('mailto:') ? '_blank' : undefined"
        block
        size="lg"
        color="primary"
      >
        Submit Application
      </UButton>

      <UButton v-else block size="lg" color="secondary" variant="outline" disabled>
        No apply link available
      </UButton>
    </div>
       

      </div>
    </div>
     </template>
  
    
    <!-- Body: description -->
    <div class="prose dark:prose-invert max-w-none">
      <h3 class="text-lg font-semibold">Overview</h3>
      <div v-if="selectedJob.job_description" v-html="marked.parse(selectedJob.job_description)"></div>
      <div v-else class="text-sm text-gray-600">No detailed description provided.</div>
    </div>

    

    <!-- Skills / Tags -->
    <div class="my-4" v-if="visibleTags(selectedJob).length > 0">
      <h3 class="text-lg font-semibold">Skills</h3>
      <div class="flex items-center flex-wrap gap-2">
        <UBadge v-for="(tag, idx) in visibleTags(selectedJob)" :key="`tag-${idx}-${tag}`" variant="soft">{{ tag }}</UBadge>
        <UBadge v-if="extraTagCount(selectedJob) > 0" color="neutral" variant="outline">+{{ extraTagCount(selectedJob) }}</UBadge>
      </div>
    </div>

    <USeparator class="my-6" />

    <!-- Details grid -->
    <div class="space-y-3">
      <h3 class="text-lg font-semibold">Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <!-- <div>
          <div class="text-gray-500">Rating</div>
          <div class="font-medium">{{ selectedJob.rating ?? '—' }} / 5</div>
        </div>
        <div>
          <div class="text-gray-500">Verified</div>
          <div class="font-medium text-blue-500">{{ selectedJob.verified ? 'Yes' : 'No' }}</div>
        </div> -->
        <div>
          <div class="text-gray-500">Workplace</div>
          <div class="font-medium">{{ selectedJob.workplace || '—' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Employment Type</div>
          <div class="font-medium">{{ selectedJob.employment_type || '—' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Deadline</div>
          <div class="font-medium">{{ selectedJob.deadline ? formatDate(selectedJob.deadline) : '—' }}</div>
        </div>
        <!-- <div>
          <div class="text-gray-500">Proposals</div>
          <div class="font-medium">{{ selectedJob.proposals ?? 0 }}</div>
        </div> -->
        <div>
          <div class="text-gray-500">Posted</div>
          <div class="font-medium">{{ timeAgo(selectedJob.created_at) }}</div>
        </div>
      </div>
    </div>


   
    <!-- Company block -->

    <!-- <div class="space-y-3">
      <h3 class="text-lg font-semibold">Company</h3>
      <div class="flex items-start gap-4">
        <UAvatar :src="selectedJob.company_logo" size="md" />
        <div class="flex-1">
          <div class="font-medium">{{ selectedJob.company_name }}</div>
          <p class="text-sm text-gray-500">{{ selectedJob.company_description }}</p>
          <div class="mt-3 flex items-center gap-2">
            <UButton v-if="selectedJob.company_website" :to="selectedJob.company_website" target="_blank" size="sm" variant="outline">Visit Website</UButton>
          </div>
        </div>
      </div>
    </div> -->
  
  </UCard>
</template>
