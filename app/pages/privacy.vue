<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const effectiveDate = 'October 11, 2026'
const { public: { CONTACT_EMAIL } } = useRuntimeConfig()

useSeoMeta({
  title: 'Privacy Policy | Addis Tech Jobs',
  description: 'Learn how Addis Tech Jobs collects, uses, stores, and protects personal information.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="Privacy Policy"
      description="How Addis Tech Jobs handles account, profile, job activity, resume, AI, and payment information."
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
          Addis Tech Jobs helps users discover technology jobs, save jobs, track
          applications, manage candidate profiles, and explore company information.
          This Privacy Policy explains what information we collect, how we use it,
          and the choices you have.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Information We Collect
        </h2>
        <ul class="list-disc space-y-2 pl-6">
          <li>Account information such as email address, authentication details, and account status.</li>
          <li>Profile information such as full name, bio, skills, experience, education, portfolio links, GitHub, LinkedIn, and profile photo.</li>
          <li>Resume Builder information such as saved resume content, selected templates, and saved AI assessment results.</li>
          <li>Job activity such as saved jobs, tracked applications, clicked application links, and related timestamps.</li>
          <li>Uploaded profile photos and PDF resumes you temporarily submit for import.</li>
          <li>Technical information such as device, browser, IP address, pages visited, and usage analytics.</li>
          <li>Communications you send to us through forms, email, or support requests.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          How We Use Information
        </h2>
        <ul class="list-disc space-y-2 pl-6">
          <li>Create and manage user accounts.</li>
          <li>Provide saved jobs, application tracking, profile, Resume Builder, and PDF export features.</li>
          <li>Improve job search, recommendations, platform performance, and user experience.</li>
          <li>Secure the platform, prevent abuse, and troubleshoot technical issues.</li>
          <li>Respond to support requests and communicate service updates.</li>
          <li>Comply with legal obligations and enforce platform policies.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Job Applications
        </h2>
        <p>
          When you click a job application link, you may be taken to a third-party
          employer website or email client. We do not control how employers or
          third-party platforms collect or use your information. Their own privacy
          policies apply.
        </p>
        <p>
          If you confirm that you applied to a job, we store that application status
          in your account so you can track it later.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Resume Imports and Profile Photos
        </h2>
        <p>
          Profile photos are stored in cloud storage connected to your account.
          When you import a PDF resume in the Resume Builder, the PDF is processed
          for that import request and is not saved to your profile or retained as an
          uploaded file. We extract its text and convert it into editable structured
          resume data.
        </p>
        <p>
          If you save the imported resume, its structured content is stored in your
          account. Generated resume PDFs are created on request from that saved
          content rather than stored as your original uploaded PDF.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">AI Resume Processing</h2>
        <p>
          When you use AI resume import, ATS scoring, or job matching, the relevant extracted resume text, saved
          resume content, and job text is sent to our configured AI provider to produce the requested result. The
          provider is instructed to process this information only for the requested extraction or assessment, but its
          own privacy and security terms also apply.
        </p>
        <p>
          We store validated structured results and non-reversible content hashes so saved or identical requests can
          be reused without another AI call. Successful resume-import results may be cached for up to 90 days. Saved
          ATS and job-match results remain associated with the relevant account, resume, or job until they are removed
          under our retention practices. Billing and operational logs do not contain raw resume text, uploaded PDF
          contents, AI prompts, or AI responses.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">Payments</h2>
        <p>
          Chapa processes Resume Builder payments. We send the information required to initialize and verify your
          payment, such as your email, name, amount, currency, and transaction reference. We store order status and
          provider references, but we do not receive or store your payment account credentials.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Sharing of Information
        </h2>
        <p>
          We do not sell your personal information.
        </p>
        <ul class="list-disc space-y-2 pl-6">
          <li>We may share information with service providers that help us operate the app, including authentication, database, storage, hosting, analytics, and infrastructure providers.</li>
          <li>We may share information with employers or recruiters only when you intentionally apply, submit, or share your information with them.</li>
          <li>We may share information when required by law or when necessary to protect rights, safety, security, or platform integrity.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Third-Party Services
        </h2>
        <p>
          Our platform may use services such as Supabase for authentication,
          database, and storage; hosting and infrastructure providers; analytics
          tools; external job application links; and AI providers used for internal
          job-post parsing or administrative tools. These services may process
          information according to their own terms and privacy policies.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Cookies and Analytics
        </h2>
        <p>
          We may use cookies or similar technologies to keep you signed in, remember
          preferences, understand site usage, and improve the service. You can
          control cookies through your browser settings.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Data Retention
        </h2>
        <p>
          We keep personal information for as long as needed to provide the service,
          comply with legal obligations, resolve disputes, prevent abuse, and
          maintain business records. You may request account deactivation or deletion
          by emailing
          <a :href="`mailto:${CONTACT_EMAIL}`" class="font-medium text-primary hover:underline">
            {{ CONTACT_EMAIL }}
          </a>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Your Choices
        </h2>
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, restrict, or request a copy of your personal information. You may
          also be able to withdraw consent where processing is based on consent.
        </p>
        <p>
          To make a privacy request, email
          <a :href="`mailto:${CONTACT_EMAIL}`" class="font-medium text-primary hover:underline">
            {{ CONTACT_EMAIL }}
          </a>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Account Security
        </h2>
        <p>
          You are responsible for keeping your login credentials secure. We use
          reasonable technical and organizational measures to protect your
          information, but no system is completely secure.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Children's Privacy
        </h2>
        <p>
          Addis Tech Jobs is not intended for children under 13. We do not knowingly
          collect personal information from children.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          International Users
        </h2>
        <p>
          Your information may be processed in countries other than where you live.
          By using the service, you understand that your information may be
          transferred and processed internationally.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material
          changes, we will update the effective date and may provide additional
          notice.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-2xl font-semibold text-highlighted">
          Contact Us
        </h2>
        <p>
          For privacy questions or requests, email Addis Tech Jobs at
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
        description="This policy is a practical draft for the product and should be reviewed by a qualified legal professional before launch."
      /> -->
    </article>
  </UContainer>
</template>
