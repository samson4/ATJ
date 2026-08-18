<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Addis Tech Jobs | Trusted tech staffing and recruiting partner.'
const description = 'Trusted staffing and recruiting partner exclusively for tech industries through top-tier talent acquisition.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://www.addistechjobs.work/logo.png',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://www.addistechjobs.work/logo.png',
  twitterCard: 'summary_large_image'
})
definePageMeta({
  layout:"landing",
   middleware: 'auth'
})

const isDark = computed({
  get() {
    return colorMode === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  }
})


</script>

<template >
 <UApp>
  <NuxtLayout class="bg-indigo-500">
    <NuxtPage />
  </NuxtLayout>
 </UApp>
      


</template>
