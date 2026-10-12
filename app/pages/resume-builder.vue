<script setup lang="ts">
import { billingProductsResponseSchema } from '~~/shared/schemas/billing'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Resume Builder | Addis Tech Jobs',
  description: 'Create tailored, ATS-friendly resumes with flexible Free and Premium plans.'
})

const steps = [
  {
    number: '01',
    title: 'Bring your experience in',
    description: 'Start from your profile, import a PDF CV, or begin with a clean page.',
    icon: 'i-lucide-file-input'
  },
  {
    number: '02',
    title: 'Shape it for the role',
    description: 'Create a focused version for every opportunity without changing your main profile.',
    icon: 'i-lucide-files'
  },
  {
    number: '03',
    title: 'Review, refine, apply',
    description: 'Check your structure, job match, and ATS feedback before exporting a polished PDF.',
    icon: 'i-lucide-badge-check'
  }
]

const freePlanFeatures = [
  'Create and save up to 5 resumes',
  '3 lifetime AI credits',
  'Every template and unlimited PDF exports',
  'Edit and preview whenever you need'
]

const { data: productCatalog, status: productCatalogStatus } = await useFetch('/api/billing/products', {
  key: 'resume-builder-billing-products',
  transform: data => billingProductsResponseSchema.parse(data)
})

const billingProducts = computed(() => productCatalog.value?.products || [])

</script>

<template>
  <main class="resume-builder overflow-hidden">
    <section class="relative border-b border-muted">
      <div class="resume-builder-grid absolute inset-0 -z-10" />
      <div class="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <UContainer class="pt-14 sm:pt-20 lg:pt-24">
        <div class="mx-auto max-w-4xl text-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Free plan available · Premium when you need more
          </div>

          <h1 class="mx-auto mt-7 max-w-4xl text-balance text-5xl font-bold tracking-[-0.045em] text-highlighted sm:text-6xl lg:text-7xl">
            Your experience deserves a
            <span class="relative inline-block whitespace-nowrap text-primary">
              better resume.
              <svg class="absolute -bottom-2 left-0 h-3 w-full" viewBox="0 0 300 12" fill="none" aria-hidden="true">
                <path d="M2 9C71 2 218 2 298 8" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
              </svg>
            </span>
          </h1>

          <p class="mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-muted sm:text-xl">
            Build clear, role-specific resumes from the experience you already have—with smart guidance built for tech job seekers.
          </p>

          <div class="mx-auto mt-9 max-w-2xl">
            <div class="rounded-2xl border border-success/30 bg-default p-3 shadow-xl shadow-success/5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
              <div class="flex items-center gap-3 text-left">
                <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <UIcon name="i-lucide-circle-check" class="size-5 text-success" />
                </span>
                <div>
                  <p class="font-semibold text-highlighted">Resume Builder is ready</p>
                  <p class="text-sm text-muted">Start free with five resumes and three AI credits.</p>
                </div>
              </div>
              <UButton to="/resumes" label="Open builder" icon="i-lucide-arrow-right" trailing class="mt-3 sm:mt-0" />
            </div>
          </div>
        </div>

        <div class="relative mx-auto mt-16 max-w-6xl pb-12 sm:mt-20 sm:pb-20">
          <div class="absolute inset-x-10 top-8 -bottom-1 -z-10 rounded-3xl bg-primary/15 blur-2xl" />
          <div class="overflow-hidden rounded-2xl border border-default bg-default shadow-2xl shadow-primary/10">
            <div class="flex h-12 items-center justify-between border-b border-muted bg-muted/50 px-4">
              <div class="flex items-center gap-1.5" aria-hidden="true">
                <span class="size-2.5 rounded-full bg-error/70" />
                <span class="size-2.5 rounded-full bg-warning/70" />
                <span class="size-2.5 rounded-full bg-success/70" />
              </div>
              <div class="flex items-center gap-2 text-xs font-medium text-muted">
                <UIcon name="i-lucide-lock-keyhole" class="size-3.5" />
                Targeted Resume · Saved
              </div>
              <span class="w-10" />
            </div>

            <div class="grid min-h-[510px] grid-cols-1 lg:grid-cols-[220px_1fr_250px]">
              <aside class="hidden border-r border-muted bg-muted/30 p-4 lg:block">
                <div class="flex items-center gap-2 px-2 py-2">
                  <span class="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-inverted">ATJ</span>
                  <span class="font-semibold text-highlighted">Resume Builder</span>
                </div>
                <p class="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-widest text-dimmed">Sections</p>
                <div class="space-y-1">
                  <div class="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
                    <UIcon name="i-lucide-user-round" class="size-4" /> Profile
                  </div>
                  <div v-for="item in ['Experience', 'Education', 'Skills', 'Projects']" :key="item" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted">
                    <span>{{ item }}</span>
                    <UIcon name="i-lucide-grip-vertical" class="size-3.5 text-dimmed" />
                  </div>
                </div>
                <div class="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p class="text-xs font-semibold text-primary">Quick tip</p>
                  <p class="mt-1 text-xs leading-5 text-muted">Use outcomes and numbers to make experience stand out.</p>
                </div>
              </aside>

              <div class="bg-muted/40 p-4 sm:p-8 lg:p-10">
                <div class="mx-auto min-h-[430px] max-w-[560px] bg-default p-7 shadow-lg ring-1 ring-default sm:p-10">
                  <div class="border-b-2 border-primary pb-5">
                    <p class="text-2xl font-bold tracking-tight text-highlighted">Sara Tesfaye</p>
                    <p class="mt-1 text-sm font-medium text-primary">Frontend Engineer</p>
                    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
                      <span>Addis Ababa, Ethiopia</span>
                      <span>sara@example.com</span>
                      <span>linkedin.com/in/sara</span>
                    </div>
                  </div>
                  <div class="mt-6">
                    <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-highlighted">Experience</p>
                    <div class="mt-3 flex justify-between gap-4">
                      <div>
                        <p class="text-sm font-semibold text-highlighted">Frontend Engineer</p>
                        <p class="text-xs text-primary">Acme Technologies</p>
                      </div>
                      <p class="text-[10px] text-muted">2023 — Present</p>
                    </div>
                    <ul class="mt-3 space-y-2 text-[11px] leading-5 text-toned">
                      <li class="flex gap-2"><span class="mt-2 size-1 shrink-0 rounded-full bg-primary" />Built accessible Vue interfaces used by 12,000+ monthly customers.</li>
                      <li class="flex gap-2"><span class="mt-2 size-1 shrink-0 rounded-full bg-primary" />Improved page performance by 38% through component and asset optimization.</li>
                      <li class="flex gap-2"><span class="mt-2 size-1 shrink-0 rounded-full bg-primary" />Partnered with product and design to ship four customer-facing workflows.</li>
                    </ul>
                  </div>
                  <div class="mt-6 grid gap-6 border-t border-muted pt-5 sm:grid-cols-2">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-highlighted">Skills</p>
                      <p class="mt-3 text-[11px] leading-5 text-toned">Vue.js · TypeScript · Nuxt · Tailwind CSS · Accessibility</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-highlighted">Education</p>
                      <p class="mt-3 text-xs font-semibold text-highlighted">BSc, Software Engineering</p>
                      <p class="text-[10px] text-muted">Addis Ababa University</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside class="hidden border-l border-muted bg-default p-5 lg:block">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-highlighted">Resume health</p>
                  <span class="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">Strong</span>
                </div>
                <div class="mt-5 flex items-end gap-2">
                  <span class="text-4xl font-bold tracking-tight text-highlighted">86</span>
                  <span class="pb-1 text-sm text-muted">/ 100</span>
                </div>
                <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div class="h-full w-[86%] rounded-full bg-primary" />
                </div>
                <div class="mt-6 space-y-3">
                  <div v-for="check in ['Clear structure', 'Strong action verbs', 'Relevant skills']" :key="check" class="flex items-center gap-2 text-sm text-toned">
                    <span class="flex size-5 items-center justify-center rounded-full bg-success/10">
                      <UIcon name="i-lucide-check" class="size-3 text-success" />
                    </span>
                    {{ check }}
                  </div>
                </div>
                <div class="mt-7 rounded-xl border border-warning/30 bg-warning/5 p-3">
                  <div class="flex items-center gap-2 text-xs font-semibold text-highlighted">
                    <UIcon name="i-lucide-lightbulb" class="size-4 text-warning" />
                    One improvement
                  </div>
                  <p class="mt-2 text-xs leading-5 text-muted">Add a measurable result to your latest project.</p>
                </div>
              </aside>
            </div>
          </div>
          <p class="mt-4 text-center text-xs text-dimmed">Illustrative product preview</p>
        </div>
      </UContainer>
    </section>

    <section class="py-20 sm:py-28">
      <UContainer>
        <div class="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">One source, many opportunities</p>
            <h2 class="mt-4 text-balance text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">A focused process from first draft to final PDF.</h2>
            <p class="mt-5 max-w-xl text-lg leading-8 text-muted">Keep your core story consistent while adapting the details that matter for each role.</p>
          </div>

          <div class="border-t border-muted">
            <article v-for="step in steps" :key="step.number" class="grid grid-cols-[auto_1fr] gap-5 border-b border-muted py-7 sm:grid-cols-[56px_1fr_auto] sm:items-start">
              <span class="text-sm font-semibold text-primary">{{ step.number }}</span>
              <div>
                <h3 class="text-xl font-semibold text-highlighted">{{ step.title }}</h3>
                <p class="mt-2 max-w-xl leading-7 text-muted">{{ step.description }}</p>
              </div>
              <span class="hidden size-11 items-center justify-center rounded-full border border-default bg-muted sm:flex">
                <UIcon :name="step.icon" class="size-5 text-primary" />
              </span>
            </article>
          </div>
        </div>
      </UContainer>
    </section>

    <section class="relative overflow-hidden border-y border-muted bg-muted/30 py-20 sm:py-28">
      <div class="absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <UContainer>
        <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Straightforward pricing</p>
            <h2 class="mt-4 max-w-2xl text-balance text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
              Start free. Upgrade when your search grows.
            </h2>
          </div>
          <p class="max-w-xl text-base leading-7 text-muted lg:justify-self-end lg:text-right">
            AI credits are used only for fresh ATS scoring and job matching. Your saved results are always free to view.
          </p>
        </div>

        <div class="mx-auto mt-12 max-w-5xl">
          <article class="flex flex-col rounded-3xl border border-default bg-default p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:gap-10">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 class="text-xl font-semibold text-highlighted">Free</h3>
                <p class="text-sm text-muted">Everything you need to begin</p>
              </div>
              <UBadge label="Forever" color="neutral" variant="subtle" />
            </div>

            <div class="mt-8 flex items-end gap-2 lg:mt-0 lg:min-w-36 lg:border-l lg:border-muted lg:pl-8">
              <span class="text-5xl font-bold tracking-[-0.05em] text-highlighted">0</span>
              <span class="pb-1 text-sm font-medium text-muted">ETB</span>
            </div>

            <ul class="mt-7 grid flex-1 gap-x-6 gap-y-3 lg:mt-0 lg:grid-cols-2">
              <li v-for="feature in freePlanFeatures" :key="feature" class="flex gap-3 text-sm leading-6 text-toned">
                <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <UIcon name="i-lucide-check" class="size-3.5 text-success" />
                </span>
                {{ feature }}
              </li>
            </ul>

            <UButton
              to="/resumes"
              label="Start free"
              color="neutral"
              variant="outline"
              size="lg"
              class="mt-8 justify-center lg:mt-0 lg:min-w-32"
            />
          </article>
        </div>

        <div class="mx-auto mt-10 max-w-5xl">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-highlighted">Upgrade options</p>
              <p class="mt-1 text-sm text-muted">Choose Premium or add credits without changing your plan.</p>
            </div>
            <p class="text-xs font-medium text-muted">Three secure, one-time purchases</p>
          </div>

          <div v-if="productCatalogStatus === 'pending'" class="mt-4 grid gap-4 md:grid-cols-3">
            <USkeleton v-for="item in 3" :key="item" class="h-[420px] rounded-3xl" />
          </div>
          <div v-else-if="billingProducts.length" class="mt-4 grid gap-4 md:grid-cols-3 md:items-stretch">
            <BillingProductCard
              v-for="product in billingProducts"
              :key="product.code"
              :product="product"
              :featured="product.kind === 'premium_pass'"
              :action-label="product.kind === 'premium_pass' ? 'Get Premium' : `Buy ${product.creditAmount} credits`"
              action-to="/billing"
            />
          </div>
          <UAlert
            v-else
            class="mt-4"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Pricing is temporarily unavailable"
            description="Open Billing to check the latest purchase options."
            :actions="[{ label: 'Open Billing', to: '/billing', color: 'neutral', variant: 'outline' }]"
          />
        </div>
      </UContainer>
    </section>

    <section class="pb-20 sm:pb-28">
      <UContainer>
        <div class="relative overflow-hidden rounded-3xl bg-inverted px-6 py-12 text-center sm:px-12 sm:py-16">
          <div class="absolute -left-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl" />
          <div class="absolute -bottom-32 -right-16 size-72 rounded-full bg-primary/15 blur-3xl" />
          <div class="relative mx-auto max-w-2xl">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Start free</p>
            <h2 class="mt-4 text-3xl font-bold tracking-tight text-inverted sm:text-4xl">Build a stronger resume for your next opportunity.</h2>
            <p class="mt-4 leading-7 text-inverted/70">Create up to five resumes for free and upgrade only when you need more capacity or AI credits.</p>
            <UButton to="/resumes" label="Open Resume Builder" icon="i-lucide-arrow-up-right" trailing size="lg" class="mt-7" />
          </div>
        </div>
      </UContainer>
    </section>
  </main>
</template>

<style scoped>
.resume-builder-grid {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ui-border-muted) 55%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ui-border-muted) 55%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, black, transparent 78%);
}
</style>
