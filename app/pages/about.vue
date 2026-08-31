<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'About Addis Tech Jobs',
  description: 'Learn about Addis Tech Jobs and its work connecting tech talent with employers in Ethiopia.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="About Addis Tech Jobs"
      description="Addis Tech Jobs is a private staffing and recruiting firm focused on connecting tech talent with companies hiring in Ethiopia."
    />

    <section class="mx-auto max-w-3xl space-y-6 text-toned">
      <p>
        We help candidates discover opportunities across software engineering, data,
        product, design, IT, and related technology roles.
      </p>
      <p>
        We also help employers reach qualified professionals who understand the local
        market and can contribute to growing technology teams.
      </p>
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Placeholder content"
        description="This page should be updated with the company's final story, services, and positioning before launch."
      />
    </section>
  </UContainer>
</template>
