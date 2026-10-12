<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const effectiveDate = 'October 11, 2026'
const { public: { CONTACT_EMAIL } } = useRuntimeConfig()

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
          education, links, and profile photo, as well as resumes you create or
          import in the Resume Builder. You are also
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
        <h2 class="text-2xl font-semibold text-highlighted">Resume Builder, AI Features, and Credits</h2>
        <p>
          Resume parsing, ATS readiness scores, job-match scores, and suggested improvements are automated,
          advisory tools. They may be incomplete or inaccurate and do not guarantee that an employer, recruiter,
          or applicant tracking system will accept, rank, or respond to your application.
        </p>
        <p>
          Importing a PDF resume does not use an AI credit. One credit is used only after a fresh ATS readiness score
          or job-match score completes successfully and its validated result is saved. Provider failures, validation
          failures, and eligible saved or cached results do not use another credit.
        </p>
        <p>
          Free accounts may save up to five resumes and receive three lifetime AI credits once per account. Premium
          provides capacity for up to 25 saved resumes and 20 included AI credits during a 30-day term. Premium access
          renews only when you make another payment and does not renew automatically. Included Premium credits expire
          with their term and do not roll over. Purchased credit packs do not expire.
        </p>
        <p>
          If Premium expires while you have more than five resumes, you may continue to view, edit, export, rename, or
          delete existing resumes. You cannot create or duplicate another resume until you renew Premium or reduce your
          saved resume count below the Free-plan limit.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">Payments and Refunds</h2>
        <p>
          Payments are processed by Chapa under its own terms. Prices are shown in Ethiopian birr before checkout.
          Current products are a 30-day Premium pass for 299 ETB, five AI credits for 99 ETB, and fifteen AI credits
          for 249 ETB. The price and benefits displayed at checkout apply to that order. Except where required by law,
          completed purchases are not refundable after their credits or Premium benefits have been used. Duplicate or
          erroneous charges should be reported promptly for review.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          User Content
        </h2>
        <p>
          You retain ownership of content you provide, such as profile details,
          portfolio links, saved resumes, photos, and comments or discussions. You give Addis
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
          For questions about these terms, email Addis Tech Jobs at
          <a :href="`mailto:${CONTACT_EMAIL}`" class="font-medium text-primary hover:underline">
            {{ CONTACT_EMAIL }}
          </a>.
        </p>
        <UButton
          :to="`mailto:${CONTACT_EMAIL}`"
          external
          color="neutral"
          variant="outline"
          icon="i-lucide-mail"
        >
          Email Addis Tech Jobs
        </UButton>
      </section>

      <!-- <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Legal note"
        description="These terms are a practical draft for the product and should be reviewed by a qualified legal professional before launch."
      /> -->
    </article>
  </UContainer>
</template>
