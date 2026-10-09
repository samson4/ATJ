<script setup lang="ts">
import { marked } from 'marked';
import { useJobStore } from "~/stores/job";
import { computed, ref, watch } from 'vue';
import type { Job } from '~/interfaces/jobInterface'
import { isJobExpired } from '~/utils/jobDeadline'
import { resumeJobMatchCategoryDefinitions } from '~~/shared/data/resumeJobMatch'
import type { ResumeJobMatchResponse } from '~~/shared/types/resume'
import { useResumeStore } from '~/stores/resume'

withDefaults(defineProps<{
  fullHeight?: boolean
}>(), {
  fullHeight: true
})

const jobStore = useJobStore();
const resumeStore = useResumeStore();
const selectedJob = computed<Job>(() => jobStore.selectedJob || ({} as Job));
const toast = useToast();
const requestUrl = useRequestURL();

const jobShareUrl = computed(() => {
  if (!selectedJob.value?.id) return '';
  return new URL(`/jobs/${encodeURIComponent(selectedJob.value.id)}`, requestUrl.origin).href;
});

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

const formatWorkplace = (workplace?: string | null) => {
  if (!workplace) return ''

  return workplace.toString().replace(/^\w/, c => c.toUpperCase())
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

const isSaved = computed(() => jobStore.isJobSaved(selectedJob.value?.id));
const isSaving = computed(() => jobStore.isSavingJob(selectedJob.value?.id));
const isApplied = computed(() => jobStore.isJobApplied(selectedJob.value?.id));
const isApplying = computed(() => jobStore.isApplyingJob(selectedJob.value?.id));
const isExpired = computed(() => isJobExpired(selectedJob.value));
const applicationPromptJobId = ref<string | null>(null);
const resumeMatchOpen = ref(false);
const resumeMatchLoading = ref(false);
const resumeMatchError = ref('');
const selectedResumeId = ref('');
const resumeMatchResult = ref<ResumeJobMatchResponse>();
const resumeMatchColor = computed(() => {
  const score = resumeMatchResult.value?.score || 0;
  return score >= 80 ? 'success' as const : score >= 60 ? 'warning' as const : 'error' as const;
});
const resumeMatchCategories = computed(() => resumeMatchResult.value
  ? Object.entries(resumeJobMatchCategoryDefinitions)
      .map(([key, definition]) => ({
        key,
        ...definition,
        ...resumeMatchResult.value!.categories[key as keyof ResumeJobMatchResponse['categories']]
      }))
      .filter(category => category.applicable)
  : []);
const dismissedApplicationPromptJobIds = ref<string[]>([]);
const showApplicationPrompt = computed(() => {
  const jobId = selectedJob.value?.id;
  return !!jobId
    && applicationPromptJobId.value === jobId
    && !isApplied.value
    && !isExpired.value
    && !dismissedApplicationPromptJobIds.value.includes(jobId);
});

const toggleSaved = async () => {
  await jobStore.toggleSavedJob(selectedJob.value);
};


const copyJobLink = async () => {
  if (!jobShareUrl.value) return;

  try {
    await navigator.clipboard.writeText(jobShareUrl.value);
    toast.add({
      title: 'Job link copied',
      description: 'The link is ready to share.',
      icon: 'i-lucide-check',
      color: 'success'
    });
  } catch {
    toast.add({
      title: 'Could not copy link',
      description: 'Please copy the URL from your browser.',
      icon: 'i-lucide-copy',
      color: 'error'
    });
  }
};
const jobActionItems = computed(() => [[
  {
    label: 'Copy link',
    icon: 'i-lucide-link',
    onSelect: copyJobLink
  },
  {
    label: isSaved.value ? 'Remove saved job' : 'Save job',
    icon: isSaved.value ? 'i-lucide-bookmark-x' : 'i-lucide-bookmark',
    disabled: isSaving.value || (isExpired.value && !isSaved.value),
    onSelect: toggleSaved
  }
]]);
const openApplyLink = (link: string) => {
  if (link.startsWith('mailto:')) {
    window.location.href = link;
    return;
  }

  window.open(link, '_blank', 'noopener,noreferrer');
};

const submitApplication = async () => {
  if (!applyLink.value || isExpired.value) return;

  openApplyLink(applyLink.value);

  const jobId = selectedJob.value?.id;
  if (!jobId || isApplied.value || dismissedApplicationPromptJobIds.value.includes(jobId)) return;

  const user = await jobStore.getCurrentUser();
  if (user) {
    applicationPromptJobId.value = jobId;
  }
};

const confirmApplied = async () => {
  const tracked = await jobStore.markJobApplied(selectedJob.value);

  if (tracked) {
    applicationPromptJobId.value = null;
  }
};

const dismissApplicationPrompt = () => {
  const jobId = selectedJob.value?.id;
  if (!jobId) return;

  if (!dismissedApplicationPromptJobIds.value.includes(jobId)) {
    dismissedApplicationPromptJobIds.value.push(jobId);
  }

  applicationPromptJobId.value = null;
};

watch(() => selectedJob.value?.id, () => {
  applicationPromptJobId.value = null;
  resumeMatchOpen.value = false;
  selectedResumeId.value = '';
  resumeMatchResult.value = undefined;
  resumeMatchError.value = '';
});

async function openResumeMatch() {
  resumeMatchOpen.value = true;
  if (resumeStore.resumes.length || resumeMatchLoading.value) return;
  resumeMatchLoading.value = true;
  resumeMatchError.value = '';
  await resumeStore.fetchResumes();
  resumeMatchLoading.value = false;
  if (resumeStore.errorMessage) resumeMatchError.value = resumeStore.errorMessage;
  if (resumeStore.resumes.length === 1) await selectResumeForMatch(resumeStore.resumes[0]!.id);
}

async function selectResumeForMatch(resumeId: string) {
  selectedResumeId.value = resumeId;
  await runResumeMatch(false);
}

async function runResumeMatch(force: boolean) {
  if (!selectedJob.value?.id || !selectedResumeId.value) return;
  resumeMatchLoading.value = true;
  resumeMatchError.value = '';
  try {
    resumeMatchResult.value = await resumeStore.matchResumeToJob(
      String(selectedJob.value.id), selectedResumeId.value, force
    );
  } catch (error: any) {
    resumeMatchError.value = error.data?.statusMessage || error.message || 'Could not score this resume for the job.';
  } finally {
    resumeMatchLoading.value = false;
  }
}

function changeMatchResume() {
  selectedResumeId.value = '';
  resumeMatchResult.value = undefined;
  resumeMatchError.value = '';
}
</script>

<template>
  <UCard
    :ui="{ body: { padding: 'sm:p-6' } }"
    :class="fullHeight ? 'h-screen overflow-y-auto' : 'h-full min-h-0 overflow-visible rounded-none ring-0 shadow-none'"
  >
    <!-- Header -->
     <template #header>
      <div class="relative space-y-4 overflow-hidden">
        <ExpiredStamp
          v-if="isExpired"
          class="pointer-events-none absolute right-1 top-0 z-10 w-32 opacity-90 sm:right-4 sm:top-1 sm:w-44"
        />
        <div class="flex items-start gap-3 sm:gap-4">
          <UAvatar :src="selectedJob.company_logo" icon="i-heroicons-building-office-2" size="lg" class="mt-0.5 shrink-0" />
          <div class="min-w-0 flex-1" :class="isExpired ? 'pr-20 sm:pr-40' : ''">
            <NuxtLink
              v-if="selectedJob.company_id"
              :to="`/company/${selectedJob.company_id}`"
              class="block truncate text-sm font-medium text-primary-600 hover:underline"
            >
              {{ selectedJob.company_name || 'Company' }}
            </NuxtLink>
            <p v-else class="truncate text-sm font-medium text-primary-600">
              {{ selectedJob.company_name || 'Company' }}
            </p>
            <h2 class="mt-1 text-xl font-bold leading-snug text-highlighted">
              {{ selectedJob.role || selectedJob.title || 'Untitled Role' }}
            </h2>
            <p class="mt-1 line-clamp-2 text-sm text-muted">
              {{ selectedJob.short_description || selectedJob.description }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span
                v-if="selectedJob.workplace"
                class="inline-flex items-center gap-1 rounded-md border border-muted px-2 py-1 text-xs font-medium text-toned"
              >
                <UIcon name="i-heroicons-map-pin" class="size-3.5" />
                {{ formatWorkplace(selectedJob.workplace) }}
              </span>
              <span
                v-if="hasSalary(selectedJob)"
                class="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-inverted"
              >
                {{ formatMoney(selectedJob.salary_min) }} - {{ formatMoney(selectedJob.salary_max) }}
              </span>
            </div>
          </div>
          <div class="hidden shrink-0 items-center gap-2 md:flex">
            <UButton
              v-if="applyLink && !isExpired"
              size="md"
              color="primary"
              class="justify-center cursor-pointer"
              @click="submitApplication"
            >
              Submit Application
            </UButton>
            <UDropdownMenu v-if="selectedJob.id" :items="jobActionItems" :content="{ align: 'end' }">
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="outline"
                size="md"
                aria-label="More job actions"
              />
            </UDropdownMenu>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-end gap-2 md:hidden">
            <UButton
              v-if="applyLink && !isExpired"
              size="md"
              color="primary"
              class="justify-center cursor-pointer"
              @click="submitApplication"
            >
              Submit Application
            </UButton>
            <UDropdownMenu v-if="selectedJob.id" :items="jobActionItems" :content="{ align: 'end' }">
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="outline"
                size="md"
                aria-label="More job actions"
              />
            </UDropdownMenu>
          </div>

         

          <div
            v-if="showApplicationPrompt"
            class="rounded-lg border border-muted bg-elevated/50 p-3 text-left sm:max-w-md"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-circle-help" class="mt-0.5 size-5 shrink-0 text-primary" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-default">Did you apply?</p>
                <p class="mt-1 text-sm text-muted">
                  Track this application so you can follow up later.
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <UButton
                    size="sm"
                    icon="i-lucide-clipboard-check"
                    :loading="isApplying"
                    :disabled="isApplying"
                    @click="confirmApplied"
                  >
                    Yes, I applied
                  </UButton>
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    :disabled="isApplying"
                    @click="dismissApplicationPrompt"
                  >
                    Not yet
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="selectedJob.id && isApplied"
            class="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary sm:justify-start"
          >
            <UIcon name="i-lucide-clipboard-check" class="size-4" />
            <span class="font-medium">Application tracked</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="selectedJob.id && !isExpired" class="mb-4 flex justify-end">
      <UButton
        label="Resume match"
        icon="i-lucide-file-search"
        color="primary"
        variant="ghost"
        size="sm"
        @click="openResumeMatch"
      />
    </div>
    
    <!-- Body: description -->
    <div class="prose dark:prose-invert max-w-none">
      <h3 class="text-lg font-semibold">Overview</h3>
      <div v-if="selectedJob.job_description" v-html="marked.parse(selectedJob.job_description)"></div>
      <div v-else class="text-sm text-gray-600">No detailed description provided.</div>
    </div>

    <UModal
      v-model:open="resumeMatchOpen"
      title="Match your resume"
      description="See how your demonstrated experience aligns with this role."
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #body>
        <div v-if="resumeMatchLoading" class="py-12 text-center">
          <UIcon name="i-lucide-loader-circle" class="mx-auto size-8 animate-spin text-primary" />
          <p class="mt-3 text-sm text-muted">Checking resume match…</p>
        </div>
        <div v-else-if="resumeMatchError && !resumeMatchResult" class="space-y-4">
          <UAlert color="error" icon="i-lucide-triangle-alert" title="Could not check resume match" :description="resumeMatchError" />
          <div class="flex justify-end"><UButton v-if="selectedResumeId" label="Try again" icon="i-lucide-refresh-cw" @click="runResumeMatch(false)" /></div>
        </div>
        <div v-else-if="resumeMatchResult" class="space-y-6">
          <UAlert v-if="resumeMatchError" color="error" title="Could not refresh this match" :description="resumeMatchError" />
          <div class="rounded-xl bg-elevated p-5">
            <div class="flex items-end justify-between gap-4">
              <div><p class="text-sm text-muted">Job match</p><p class="text-4xl font-bold text-highlighted">{{ resumeMatchResult.score }}<span class="text-lg font-medium text-muted">/100</span></p></div>
              <UBadge :color="resumeMatchColor" variant="subtle" :label="resumeMatchResult.score >= 80 ? 'Strong match' : resumeMatchResult.score >= 60 ? 'Good potential' : 'Partial match'" />
            </div>
            <UProgress class="mt-4" :model-value="resumeMatchResult.score" :color="resumeMatchColor" />
            <p class="mt-4 text-sm leading-6 text-muted">{{ resumeMatchResult.summary }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="category in resumeMatchCategories" :key="category.key" class="rounded-lg border border-default p-4">
              <div class="flex justify-between gap-3"><p class="font-medium text-highlighted">{{ category.label }}</p><span class="text-sm font-semibold">{{ category.score }}/100</span></div>
              <p class="mt-2 text-sm text-muted">{{ category.feedback }}</p>
            </div>
          </div>

          <div v-if="resumeMatchResult.strengths.length">
            <h3 class="mb-3 font-semibold text-highlighted">Strong matches</h3>
            <div class="space-y-3"><div v-for="item in resumeMatchResult.strengths" :key="item.title" class="rounded-lg bg-success/5 p-4"><p class="font-medium text-highlighted">{{ item.title }}</p><p class="mt-1 text-sm text-muted">{{ item.detail }}</p><p class="mt-2 border-l-2 border-success pl-3 text-xs italic text-muted">“{{ item.resumeEvidence }}”</p></div></div>
          </div>

          <div v-if="resumeMatchResult.improvements.length">
            <h3 class="mb-3 font-semibold text-highlighted">Improve your alignment</h3>
            <div class="space-y-3"><div v-for="item in resumeMatchResult.improvements" :key="item.title" class="rounded-lg bg-warning/5 p-4"><div class="flex items-center justify-between gap-2"><p class="font-medium text-highlighted">{{ item.title }}</p><UBadge :label="item.classification === 'strict' ? 'Required' : 'Preferred'" :color="item.classification === 'strict' ? 'error' : 'neutral'" variant="subtle" /></div><p class="mt-1 text-sm text-muted">{{ item.detail }}</p><p class="mt-2 text-xs text-muted"><span class="font-medium">Job:</span> “{{ item.jobEvidence }}”</p><div class="mt-3 rounded-md bg-default p-3"><p class="text-xs font-semibold uppercase tracking-wide text-muted">Suggested fix</p><p class="mt-1 whitespace-pre-line text-sm leading-6 text-highlighted">{{ item.suggestedFix }}</p></div></div></div>
          </div>

          <p class="text-xs text-muted">This score estimates alignment from resume evidence. It does not determine whether you should apply.</p>
        </div>
        <div v-else-if="resumeStore.resumes.length" class="space-y-3">
          <p class="text-sm text-muted">Choose the resume you want to compare:</p>
          <button v-for="resume in resumeStore.resumes" :key="resume.id" type="button" class="flex w-full items-center justify-between rounded-lg border border-default p-4 text-left transition hover:border-primary hover:bg-primary/5" @click="selectResumeForMatch(resume.id)"><span><span class="block font-medium text-highlighted">{{ resume.name }}</span><span class="mt-0.5 block text-sm text-muted">{{ resume.content.basics.headline || 'Resume' }}</span></span><UIcon name="i-lucide-chevron-right" class="size-5 text-muted" /></button>
        </div>
        <div v-else class="py-8 text-center">
          <UIcon name="i-lucide-file-plus-2" class="mx-auto size-9 text-muted" />
          <p class="mt-3 font-medium text-highlighted">Create a resume first</p>
          <p class="mt-1 text-sm text-muted">You need a saved resume to check your match.</p>
          <UButton to="/resumes" label="Create resume" class="mt-4" />
        </div>
      </template>
      <template v-if="!resumeMatchLoading" #footer>
        <div class="flex w-full justify-end gap-2"><UButton v-if="resumeMatchResult" label="Change resume" color="neutral" variant="ghost" @click="changeMatchResume" /><UButton label="Close" color="neutral" variant="outline" @click="resumeMatchOpen = false" /><UButton v-if="resumeMatchResult" label="Rerun match" icon="i-lucide-refresh-cw" @click="runResumeMatch(true)" /></div>
      </template>
    </UModal>

    

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
