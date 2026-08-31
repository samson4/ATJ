<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const effectiveDate = 'August 31, 2026'

useSeoMeta({
  title: 'Privacy Policy | Addis Tech Jobs',
  description: 'Learn how Addis Tech Jobs collects, uses, stores, and protects personal information.'
})
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="Privacy Policy"
      description="How Addis Tech Jobs handles account, profile, job activity, and uploaded document information."
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
          <li>Profile information such as full name, bio, skills, experience, education, portfolio links, GitHub, LinkedIn, profile photo, and CV or resume link.</li>
          <li>Job activity such as saved jobs, tracked applications, clicked application links, and related timestamps.</li>
          <li>Uploaded files such as profile photos and CV or resume documents you choose to upload.</li>
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
          <li>Provide saved jobs, application tracking, profile, and document features.</li>
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
          Uploaded CVs and Profile Photos
        </h2>
        <p>
          If you upload a CV, resume, or profile photo, we store it using cloud
          storage connected to your account. These files are used to support your
          profile features unless you choose to share them elsewhere.
        </p>
        <p>
          Do not upload sensitive documents unless you are comfortable storing them
          in your account.
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
          by contacting us through the contact page.
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
          To make a privacy request, contact us through the contact page.
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
          For privacy questions or requests, contact Addis Tech Jobs through our
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
        description="This policy is a practical draft for the product and should be reviewed by a qualified legal professional before launch."
      />
    </article>
  </UContainer>
</template>
