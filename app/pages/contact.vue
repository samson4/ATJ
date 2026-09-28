<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const linkedinUrl = 'https://et.linkedin.com/company/addis-tech-jobs'
const { public: { CONTACT_EMAIL } } = useRuntimeConfig()

useSeoMeta({
  title: 'Contact Addis Tech Jobs',
  description: 'Contact Addis Tech Jobs for candidate, employer, and partnership inquiries.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="Contact Addis Tech Jobs"
      description="Reach out for hiring, recruiting, candidate support, and partnership inquiries."
    />

    <section class="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-mail" class="size-5 text-primary" />
            <h2 class="text-lg font-semibold text-highlighted">
              Email
            </h2>
          </div>
        </template>
        <p class="text-sm leading-6 text-muted">
          Send us an email and we’ll get back to you as soon as possible.
        </p>
        <UButton
          :to="`mailto:${CONTACT_EMAIL}`"
          external
          icon="i-lucide-mail"
          color="neutral"
          variant="outline"
          class="mt-4"
        >
          {{ CONTACT_EMAIL }}
        </UButton>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-linkedin" class="size-5 text-primary" />
            <h2 class="text-lg font-semibold text-highlighted">
              LinkedIn
            </h2>
          </div>
        </template>
        <p class="text-sm leading-6 text-muted">
          Follow Addis Tech Jobs on LinkedIn for company updates and public announcements.
        </p>
        <UButton
          :to="linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          external
          icon="i-lucide-linkedin"
          color="neutral"
          variant="outline"
          class="mt-4"
          aria-label="Open Addis Tech Jobs on LinkedIn"
        >
          Open LinkedIn
        </UButton>
      </UCard>
    </section>
  </UContainer>
</template>
