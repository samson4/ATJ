<script setup lang="ts">
const year = new Date().getFullYear()
const linkedinUrl = 'https://et.linkedin.com/company/addis-tech-jobs'

const exploreLinks = [
  { label: 'Jobs', to: '/' },
  { label: 'Companies', to: '/companies' },
  { label: 'Sign In', to: '/auth/signin' },
  { label: 'Sign Up', to: '/auth/signup' }
]

const supportLinks = [
  { label: 'Contact', to: '/contact' },
  { label: 'About', to: '/about' }
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' }
]
</script>

<template>
  <USeparator />
  <UFooter>
    <UContainer class="py-8">
      <div class="grid gap-8 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
        <div class="space-y-4">
          <NuxtLink to="/" aria-label="Addis Tech Jobs home" class="inline-flex">
            <AppLogo class="h-8 w-auto" />
          </NuxtLink>
          <p class="max-w-sm text-sm leading-6 text-muted">
            Connecting Ethiopia's tech talent with companies hiring for software, data,
            product, design, and IT roles.
          </p>
          <p class="text-sm text-muted">
            Addis Tech Jobs © {{ year }}
          </p>
        </div>

        <nav aria-labelledby="footer-explore" class="space-y-3">
          <h2 id="footer-explore" class="text-sm font-semibold text-highlighted">
            Explore
          </h2>
          <ul class="space-y-2">
            <li v-for="link in exploreLinks" :key="link.to">
              <NuxtLink :to="link.to" class="text-sm text-muted hover:text-highlighted">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-support" class="space-y-3">
          <h2 id="footer-support" class="text-sm font-semibold text-highlighted">
            Support
          </h2>
          <ul class="space-y-2">
            <li v-for="link in supportLinks" :key="link.to">
              <NuxtLink :to="link.to" class="text-sm text-muted hover:text-highlighted">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal" class="space-y-3">
          <h2 id="footer-legal" class="text-sm font-semibold text-highlighted">
            Legal
          </h2>
          <ul class="space-y-2">
            <li v-for="link in legalLinks" :key="link.to">
              <NuxtLink :to="link.to" class="text-sm text-muted hover:text-highlighted">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-highlighted">
            Social
          </h2>
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
        </div>
      </div>
    </UContainer>
  </UFooter>
</template>
