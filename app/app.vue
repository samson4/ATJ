<script setup>
const siteUrl = 'https://addistechjobs.work'
const siteImage = `${siteUrl}/logo.png`
const route = useRoute()
const canonicalUrl = computed(() => `${siteUrl}${route.path === '/' ? '/' : route.path}`)

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'canonical', href: canonicalUrl }
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
  robots: 'index, follow',
  ogSiteName: 'Addis Tech Jobs',
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogImage: siteImage,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: siteImage,
  twitterCard: 'summary_large_image'
})
definePageMeta({
  layout:"landing"
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
