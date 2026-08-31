<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'About Addis Tech Jobs',
  description: 'Learn how Addis Tech Jobs helps technology professionals and employers connect in Ethiopia.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="About Addis Tech Jobs"
      description="A focused job discovery and recruiting platform for Ethiopia's growing technology market."
    />

    <section class="mx-auto max-w-4xl space-y-10 text-toned">
      <div class="mx-auto max-w-3xl space-y-5 text-center">
        <p class="text-lg leading-8">
          Addis Tech Jobs exists to make technology hiring easier to navigate for
          candidates and companies. We bring software, data, product, design,
          DevOps, cybersecurity, IT, and related roles into one focused place.
        </p>
        <p>
          For candidates, the platform is built around practical job discovery:
          searchable roles, company pages, saved jobs, application tracking, profile
          tools, and resources that help people stay organized while they look for
          their next opportunity.
        </p>
        <p>
          For employers and recruiters, Addis Tech Jobs helps roles reach people who
          are already looking for technology work and understand the local market.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UPageCard
          icon="i-lucide-search"
          title="Focused Discovery"
          description="Technology jobs without the noise of unrelated listings."
          variant="subtle"
        />
        <UPageCard
          icon="i-lucide-building-2"
          title="Company Context"
          description="Profiles, hiring activity, and role information that help candidates evaluate employers."
          variant="subtle"
        />
        <UPageCard
          icon="i-lucide-list-checks"
          title="Application Tools"
          description="Saved jobs, tracked applications, and profiles that keep a job search organized."
          variant="subtle"
        />
      </div>

      <UCard>
        <div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 class="text-2xl font-semibold text-highlighted">
              Built for Ethiopia's tech ecosystem
            </h2>
            <p class="mt-3">
              Our goal is to support a stronger local hiring loop where candidates
              can find relevant opportunities faster, and companies can reach the
              talent they need with clearer job information.
            </p>
          </div>

          <div class="flex flex-wrap gap-2 md:justify-end">
            <UBadge color="primary" variant="soft">Software</UBadge>
            <UBadge color="primary" variant="soft">Data</UBadge>
            <UBadge color="primary" variant="soft">Product</UBadge>
            <UBadge color="primary" variant="soft">Design</UBadge>
            <UBadge color="primary" variant="soft">IT</UBadge>
          </div>
        </div>
      </UCard>

      <div class="flex flex-col items-center gap-3 text-center">
        <h2 class="text-2xl font-semibold text-highlighted">
          Find your next tech role
        </h2>
        <p class="max-w-2xl">
          Browse current openings, explore companies, and keep track of the roles
          you want to revisit.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <UButton to="/" icon="i-lucide-briefcase-business">
            Browse Jobs
          </UButton>
          <UButton
            to="/companies"
            color="neutral"
            variant="outline"
            icon="i-lucide-building-2"
          >
            Explore Companies
          </UButton>
        </div>
      </div>
    </section>
  </UContainer>
</template>
