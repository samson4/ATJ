<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const effectiveDate = 'August 31, 2026'

useSeoMeta({
  title: 'Terms of Service | Addis Tech Jobs',
  description: 'Read the terms that govern use of Addis Tech Jobs.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="Terms of Service"
      description="The rules and responsibilities that apply when using Addis Tech Jobs."
    />

    <article class="mx-auto max-w-3xl space-y-8 text-toned">
      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-calendar-days"
        title="Effective date"
        :description="effectiveDate"
      />

      <section class="space-y-3">
        <p>
          These Terms of Service govern your access to and use of Addis Tech Jobs,
          including our website, job discovery tools, candidate profile features,
          saved jobs, application tracking, company pages, and related services.
          By using the platform, you agree to these terms.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Use of the Platform
        </h2>
        <p>
          Addis Tech Jobs is intended for lawful job search, recruiting, hiring, and
          related professional purposes. You agree not to misuse the platform,
          interfere with its operation, attempt unauthorized access, scrape or copy
          data at scale, or use the service for spam, fraud, harassment, or unlawful
          activity.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Accounts and Profiles
        </h2>
        <p>
          You are responsible for the accuracy of information you add to your
          account or profile, including your name, bio, skills, experience,
          education, links, profile photo, and CV or resume. You are also
          responsible for keeping your login credentials secure.
        </p>
        <p>
          We may suspend, deactivate, or restrict accounts that violate these terms,
          create risk for other users, or abuse the platform.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Job Listings
        </h2>
        <p>
          Job listings may come from employers, recruiters, public sources, or
          administrative review. We try to keep listings useful and accurate, but we
          do not guarantee that every role is available, error-free, complete, or
          still accepting applications.
        </p>
        <p>
          Candidates should independently review each employer, role, compensation
          claim, deadline, and application instruction before applying.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Applications and Third-Party Links
        </h2>
        <p>
          When you click an application link, you may leave Addis Tech Jobs and
          interact with an employer website, email address, or third-party platform.
          We are not responsible for third-party websites, hiring decisions,
          communications, data practices, or application outcomes.
        </p>
        <p>
          Application tracking is provided for your convenience. Marking a job as
          applied does not submit an application on your behalf.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          User Content
        </h2>
        <p>
          You retain ownership of content you provide, such as profile details,
          portfolio links, CVs, photos, and comments or discussions. You give Addis
          Tech Jobs permission to store, display, process, and use that content as
          needed to operate the service.
        </p>
        <p>
          You must not upload or submit content that is unlawful, misleading,
          harmful, infringing, discriminatory, or otherwise inappropriate for a
          professional job platform.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Employers and Recruiters
        </h2>
        <p>
          Employers and recruiters are responsible for ensuring that job posts,
          company information, hiring communications, and application processes are
          accurate, lawful, non-discriminatory, and respectful of candidate privacy.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          No Employment Guarantee
        </h2>
        <p>
          Addis Tech Jobs does not guarantee interviews, offers, employment,
          candidate availability, salary outcomes, or hiring results. The platform is
          a discovery and recruiting support tool.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Service Availability
        </h2>
        <p>
          We may update, suspend, remove, or change parts of the platform at any
          time. We aim to provide a reliable service, but we do not guarantee
          uninterrupted access or error-free operation.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Privacy
        </h2>
        <p>
          Our Privacy Policy explains how we collect, use, store, and protect
          information. By using Addis Tech Jobs, you also agree to the practices
          described in our Privacy Policy.
        </p>
        <UButton
          to="/privacy"
          color="neutral"
          variant="outline"
          icon="i-lucide-shield"
        >
          Read Privacy Policy
        </UButton>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Changes to These Terms
        </h2>
        <p>
          We may update these Terms of Service from time to time. If we make
          material changes, we will update the effective date and may provide
          additional notice.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Contact
        </h2>
        <p>
          For questions about these terms, contact Addis Tech Jobs through our
          contact page.
        </p>
        <UButton
          to="/contact"
          color="neutral"
          variant="outline"
          icon="i-lucide-mail"
        >
          Contact Addis Tech Jobs
        </UButton>
      </section>

      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Legal note"
        description="These terms are a practical draft for the product and should be reviewed by a qualified legal professional before launch."
      />
    </article>
  </UContainer>
</template>
