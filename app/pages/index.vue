<script setup lang="ts">
definePageMeta({
  layout: 'default',
  scrollToTop: false
})

const title = 'Tech Jobs in Addis Ababa | Addis Tech Jobs'
const description = 'Find software, data, product, design, DevOps, and IT jobs in Addis Ababa and across Ethiopia. Search openings, explore companies, and track your applications.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description
})
</script>

<template>
  <JobsJobBrowser />
</template>
