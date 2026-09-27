<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { useJobStore } from '~/stores/job'

definePageMeta({
  layout: 'default',
  scrollToTop: false
})

const route = useRoute()
const jobStore = useJobStore()
const { $supabase } = useNuxtApp()
const jobId = computed(() => String(route.params.id || ''))

const fetchJob = async () => {
  const { data, error } = await $supabase
    .schema('jobs')
    .from('job_with_company_info')
    .select('*')
    .eq('id', jobId.value)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not load job',
      cause: error
    })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Job not found'
    })
  }

  return data
}

const { data: job, error } = await useAsyncData(
  () => `job-${jobId.value}`,
  fetchJob,
  { watch: [jobId] }
)

if (error.value) throw error.value
if (!job.value) {
  throw createError({ statusCode: 404, statusMessage: 'Job not found' })
}

jobStore.selectedJob = job.value

watch(job, (value) => {
  if (value) jobStore.selectedJob = value
})

watch(error, (value) => {
  if (value) showError(value)
})

onBeforeRouteLeave(() => {
  jobStore.selectedJob = {}
})

const pageTitle = computed(() => {
  const role = job.value?.role || job.value?.title || 'Job opportunity'
  return `${role} at ${job.value?.company_name || 'Addis Tech Jobs'}`
})

const pageDescription = computed(() =>
  job.value?.short_description
  || job.value?.description
  || 'View this job opportunity on Addis Tech Jobs.'
)

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <JobsJobBrowser />
</template>
