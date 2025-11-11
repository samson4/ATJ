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
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
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

      <NuxtLayout class="bg-indigo-500">
    <NuxtPage />
  </NuxtLayout>


</template>
