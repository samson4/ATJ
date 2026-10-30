<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'About Addis Tech Jobs',
  description: 'Addis Tech Jobs helps candidates find tech roles in Ethiopia and helps employers hire through targeted sourcing, screening, interviewing, and shortlisting.'
})

const { public: { CONTACT_EMAIL } } = useRuntimeConfig()

const hireSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(120),
  email: z.email('Enter a valid work email'),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  otherContact: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Tell us about the roles you need').max(4000)
})

type HireSchema = z.output<typeof hireSchema>

const hireForm = reactive<HireSchema>({
  name: '',
  email: '',
  company: '',
  otherContact: '',
  message: ''
})

const submitting = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function submitHireInquiry(event: FormSubmitEvent<HireSchema>) {
  submitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/contact/hire', {
      method: 'POST',
      body: event.data
    })
    sent.value = true
    hireForm.name = ''
    hireForm.email = ''
    hireForm.company = ''
    hireForm.otherContact = ''
    hireForm.message = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage
      || error?.statusMessage
      || `We could not send your inquiry. Please email ${CONTACT_EMAIL}.`
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-12">
    <UPageHero
      title="About Addis Tech Jobs"
      description="A full-cycle tech recruiting partner for employers, and a focused job discovery platform for candidates in Ethiopia."
    />

    <section class="mx-auto max-w-5xl space-y-12 text-toned">
      <p class="mx-auto max-w-3xl text-center text-lg leading-8">
        Addis Tech Jobs exists to make technology hiring easier for companies and
        candidates. We specialize in software, data, product, design, DevOps,
        cybersecurity, IT, and related roles across Ethiopia.
      </p>

      <section class="space-y-8">
        <div class="space-y-5">
          <h2 class="text-2xl font-semibold text-highlighted">
            For employers
          </h2>
          <p>
            Addis Tech Jobs is a staffing and recruiting partner for technology teams.
            We manage the end-to-end hiring process so employers can focus on building
            product while we find and evaluate the right people.
          </p>
          <ul class="list-disc space-y-2 pl-5">
            <li>
              <span class="font-medium text-highlighted">Targeted sourcing</span>
              — we identify and reach candidates who match the role, stack, and seniority you need.
            </li>
            <li>
              <span class="font-medium text-highlighted">Screening</span>
              — we review experience, skills, and fit before anyone reaches your team.
            </li>
            <li>
              <span class="font-medium text-highlighted">Interviewing</span>
              — we coordinate and support interview stages so evaluation stays consistent and efficient.
            </li>
            <li>
              <span class="font-medium text-highlighted">Shortlisting</span>
              — we deliver a shortlist of qualified candidates ready for your final decision.
            </li>
          </ul>
          <p>
            Whether you need one specialist or ongoing tech hiring support, we handle
            the full process from search through shortlist.
          </p>
        </div>

        <div class="grid gap-8 rounded-2xl border border-default bg-elevated/40 p-6 md:grid-cols-2 md:p-8">
          <div class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary">
              Ready to hire?
            </p>
            <h3 class="text-2xl font-semibold text-highlighted md:text-3xl">
              Tell us about the roles you need filled
            </h3>
            <p class="leading-7">
              Share a short brief and we’ll follow up to walk through the role, how we’d
              run the search, and what a shortlist would look like for your team.
            </p>
            <ul class="space-y-3 text-sm leading-6">
              <li class="flex gap-2">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
                <span>We reply to hiring inquiries at {{ CONTACT_EMAIL }}.</span>
              </li>
              <li class="flex gap-2">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Use the form for role details, timelines, and stack requirements.</span>
              </li>
              <li class="flex gap-2">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Prefer email? Write us directly and include your company name.</span>
              </li>
            </ul>
          </div>

          <div class="rounded-xl border border-default bg-default p-5 shadow-sm md:p-6">
            <div v-if="sent" class="flex h-full flex-col justify-center gap-4 py-6 text-center">
              <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                <UIcon name="i-lucide-check" class="size-6" />
              </div>
              <div class="space-y-2">
                <h4 class="text-xl font-semibold text-highlighted">Inquiry sent</h4>
                <p class="text-sm leading-6 text-muted">
                  Thanks — we received your message and will get back to you soon.
                </p>
              </div>
              <UButton color="neutral" variant="outline" @click="sent = false">
                Send another inquiry
              </UButton>
            </div>

            <UForm
              v-else
              :schema="hireSchema"
              :state="hireForm"
              class="space-y-4"
              @submit="submitHireInquiry"
            >
              <UFormField label="Name" name="name" required>
                <UInput v-model="hireForm.name" placeholder="Your name" size="lg" class="w-full" />
              </UFormField>

              <UFormField label="Work email" name="email" required>
                <UInput
                  v-model="hireForm.email"
                  type="email"
                  placeholder="you@company.com"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Company" name="company">
                <UInput v-model="hireForm.company" placeholder="Company name" size="lg" class="w-full" />
              </UFormField>

              <UFormField label="Other ways to get in touch" name="otherContact">
                <UInput
                  v-model="hireForm.otherContact"
                  placeholder="Phone, Telegram, or LinkedIn"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Any additional information" name="message" required>
                <UTextarea
                  v-model="hireForm.message"
                  :rows="5"
                  placeholder="Roles, stack, seniority, location, and timeline"
                  class="w-full"
                />
              </UFormField>

              <UAlert
                v-if="errorMessage"
                color="error"
                icon="i-lucide-triangle-alert"
                title="Could not send inquiry"
                :description="errorMessage"
              />

              <UButton
                type="submit"
                size="lg"
                block
                icon="i-lucide-send"
                :loading="submitting"
              >
                Send hiring inquiry
              </UButton>
            </UForm>
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <h2 class="text-2xl font-semibold text-highlighted">
          For job seekers
        </h2>
        <p>
          The platform is built around practical job discovery: searchable tech roles,
          company context, saved jobs, application tracking, profile tools, and
          resources that help you stay organized while you look for your next
          opportunity.
        </p>
        <ul class="list-disc space-y-2 pl-5">
          <li>
            <span class="font-medium text-highlighted">Focused discovery</span>
            — technology jobs without the noise of unrelated listings.
          </li>
          <li>
            <span class="font-medium text-highlighted">Company context</span>
            — role and employer information that helps you evaluate opportunities.
          </li>
          <li>
            <span class="font-medium text-highlighted">Application tools</span>
            — saved jobs, tracked applications, and profiles that keep your search organized.
          </li>
        </ul>
        <UButton to="/" icon="i-lucide-briefcase-business">
          Browse Jobs
        </UButton>
      </section>

      <UCard>
        <div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 class="text-2xl font-semibold text-highlighted">
              Built for Ethiopia's tech ecosystem
            </h2>
            <p class="mt-3">
              Our goal is a stronger local hiring loop: companies get dedicated recruiting
              support, and candidates find relevant opportunities faster.
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
    </section>
  </UContainer>
</template>
