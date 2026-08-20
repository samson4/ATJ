<template>
  <UCard v-if="loading">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <USkeleton class="size-20 rounded-md" />
        <div class="flex-1 space-y-3">
          <USkeleton class="h-7 w-56" />
          <USkeleton class="h-4 w-full max-w-xl" />
          <USkeleton class="h-4 w-3/4 max-w-lg" />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <USkeleton v-for="item in 4" :key="item" class="h-20 rounded-md" />
      </div>
    </div>
  </UCard>

  <UCard v-else-if="company">
    <div class="space-y-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UAvatar
            :src="company.logo"
            :alt="company.name"
            icon="i-lucide-building-2"
            size="3xl"
            class="shrink-0 rounded-md ring ring-default"
          />

          <div class="min-w-0 space-y-3">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-3xl font-bold text-highlighted">
                  {{ company.name }}
                </h1>
                <UBadge v-if="company.industry" color="primary" variant="soft">
                  {{ company.industry }}
                </UBadge>
              </div>

              <p class="max-w-3xl text-sm leading-6 text-toned sm:text-base">
                {{ company.description || 'Company overview is not available yet.' }}
              </p>
            </div>

          </div>
        </div>

        <div class="flex flex-wrap gap-2 lg:justify-end">
          <UButton
            v-if="company.website"
            :to="company.website"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-lucide-external-link"
            label="Visit website"
          />
          <UButton
            v-if="company.linkedin_url"
            :to="company.linkedin_url"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            icon="i-lucide-linkedin"
            aria-label="Open LinkedIn"
          />
          <UButton
            v-if="company.twitter_url"
            :to="company.twitter_url"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            icon="i-lucide-twitter"
            aria-label="Open X or Twitter"
          />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="rounded-md border border-muted bg-muted/40 p-4"
        >
          <div class="flex items-center gap-2 text-sm text-muted">
            <UIcon :name="stat.icon" class="size-4" />
            <span>{{ stat.label }}</span>
          </div>
          <p class="mt-3 text-2xl font-semibold text-highlighted">
            {{ stat.value }}
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
          <UIcon name="i-lucide-info" class="size-4" />
          <span>Company snapshot</span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="fact in companyFacts"
            :key="fact.label"
            class="rounded-md border border-muted p-4"
          >
            <div class="flex items-center gap-2 text-xs font-medium uppercase text-muted">
              <UIcon :name="fact.icon" class="size-4" />
              <span>{{ fact.label }}</span>
            </div>
            <p class="mt-2 text-sm font-semibold text-highlighted">
              {{ fact.value }}
            </p>
            <p v-if="fact.helper" class="mt-1 text-xs text-muted">
              {{ fact.helper }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="stats.topTags.length" class="space-y-3">
        <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
          <UIcon name="i-lucide-tags" class="size-4" />
          <span>Top skills hiring for</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="tag in stats.topTags" :key="tag" color="primary" variant="soft">
            {{ tag }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Company } from '~/interfaces/companyInterface'

interface CompanyStats {
  activeJobs: number
  latestJobDate: string | null
  topTags: string[]
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
}

const props = withDefaults(defineProps<{
  company?: Company | null
  stats?: CompanyStats
  loading?: boolean
}>(), {
  company: null,
  loading: false,
  stats: () => ({
    activeJobs: 0,
    latestJobDate: null,
    topTags: [],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null
  })
})

const formatDate = (date?: string | null) => {
  if (!date) return 'No jobs yet'

  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return null

  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numericValue)) return value.toString()

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(numericValue)
}

const formatMoney = (value?: number | null, currency = 'USD') => {
  if (value === null || value === undefined) return null

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value)
  } catch {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0
    }).format(value)
  }
}

const formatSalaryRange = computed(() => {
  if (!props.company) return 'Not listed'

  if (props.company.estimated_salary_range) {
    return props.company.estimated_salary_range
  }

  const currency = props.company.estimated_salary_currency || props.stats.salaryCurrency || 'USD'
  const salaryMin = props.company.estimated_salary_min ?? props.stats.salaryMin
  const salaryMax = props.company.estimated_salary_max ?? props.stats.salaryMax

  if (salaryMin !== null && salaryMax !== null) {
    return `${formatMoney(salaryMin, currency)} - ${formatMoney(salaryMax, currency)}`
  }

  if (salaryMin !== null) {
    return `From ${formatMoney(salaryMin, currency)}`
  }

  if (salaryMax !== null) {
    return `Up to ${formatMoney(salaryMax, currency)}`
  }

  return 'Not listed'
})

const formatOfficeLocations = (locations?: string[] | string | null) => {
  if (Array.isArray(locations)) {
    return locations.filter(Boolean).join(', ') || 'Not listed'
  }

  return locations || 'Not listed'
}

const companyFacts = computed(() => {
  if (!props.company) return []

  return [
    {
      label: 'Employees',
      value: formatNumber(props.company.employee_count) || props.company.company_size || 'Not listed',
      icon: 'i-lucide-users'
    },
    {
      label: 'Headquarters',
      value: props.company.headquarters || 'Not listed',
      icon: 'i-lucide-map-pin'
    },
    {
      label: 'Office locations',
      value: formatOfficeLocations(props.company.office_locations),
      helper: Array.isArray(props.company.office_locations) && props.company.office_locations.length > 1
        ? `${props.company.office_locations.length} offices listed`
        : undefined,
      icon: 'i-lucide-building-2'
    },
    {
      label: 'Estimated salary',
      value: formatSalaryRange.value,
      helper: formatSalaryRange.value !== 'Not listed' ? 'Based on available company and job data' : undefined,
      icon: 'i-lucide-banknote'
    },
    {
      label: 'Industry',
      value: props.company.industry || 'Not listed',
      icon: 'i-lucide-briefcase-business'
    },
    {
      label: 'Founded',
      value: props.company.founded_year?.toString() || 'Not listed',
      icon: 'i-lucide-calendar'
    }
  ]
})

const statCards = computed(() => [
  {
    label: 'Open roles',
    value: props.stats.activeJobs.toString(),
    icon: 'i-lucide-briefcase-business'
  },
  {
    label: 'Latest posting',
    value: formatDate(props.stats.latestJobDate),
    icon: 'i-lucide-calendar-clock'
  },
  {
    label: 'Skills hiring for',
    value: props.stats.topTags.length.toString(),
    icon: 'i-lucide-tags'
  }
])
</script>
