<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'landing' })

const linkedinUrl = 'https://et.linkedin.com/company/addis-tech-jobs'
const telegramUrl = 'https://t.me/addistechjobs'
const { public: { CONTACT_EMAIL } } = useRuntimeConfig()

useSeoMeta({
  title: 'Contact Addis Tech Jobs',
  description: 'Contact Addis Tech Jobs for candidate, employer, and partnership inquiries.'
})

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
            <UIcon name="i-lucide-share-2" class="size-5 text-primary" />
            <h2 class="text-lg font-semibold text-highlighted">
              Socials
            </h2>
          </div>
        </template>
        <p class="text-sm leading-6 text-muted">
          Follow Addis Tech Jobs on social platforms for updates, announcements, and community news.
        </p>
        <div class="mt-4 flex flex-col gap-3">
          <UButton
            :to="linkedinUrl"
            target="_blank"
            rel="noopener noreferrer"
            external
            icon="i-lucide-linkedin"
            color="neutral"
            variant="outline"
            aria-label="Open Addis Tech Jobs on LinkedIn"
          >
            LinkedIn
          </UButton>
          <UButton
            :to="telegramUrl"
            target="_blank"
            rel="noopener noreferrer"
            external
            icon="i-simple-icons-telegram"
            color="neutral"
            variant="outline"
            aria-label="Open Addis Tech Jobs on Telegram"
          >
            Telegram
          </UButton>
        </div>
      </UCard>
    </section>

    <section class="mx-auto mt-12 max-w-5xl">
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
              <span>We respond to hiring inquiries at {{ CONTACT_EMAIL }}.</span>
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
  </UContainer>
</template>
