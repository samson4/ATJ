<template>
  <UPage>
    <UContainer class="py-6 sm:py-8">
      <div class="space-y-8">
        <UAlert
          v-if="!loading && !company"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Company not found"
          :description="companyError || 'This company profile could not be loaded.'"
        />

        <div
          v-else
          class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_480px]"
        >
          <main class="min-w-0 space-y-8">
            
            <UTabs
              v-if="company"
              class="w-full"
              :unmount-on-hide="false"
              :items="tabs"
              variant="link"
            >
              <template #about>
                <CompanyInfo
              :company="company"
              :stats="companyStats"
              :loading="loading"
            />

              </template>

              <template #jobs>
                <JobsFromCompany />
              </template>

              <template #discussions>
                <CompanyDiscussions
                  v-if="authStore.authenticated_user?.id"
                  :company="company"
                />
                <UAlert
                  v-else
                  class="mt-6"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-lock"
                  title="Sign in to join the discussion"
                  description="Create or sign in to your account to view and participate in company discussions."
                />
              </template>
            </UTabs>
          </main>

          <aside v-if="company" class="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <CompanySimilarCompanies
              :company-id="company.id"
              layout="rail"
            />
          </aside>
        </div>
      </div>
    </UContainer>
  </UPage>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Company } from '~/interfaces/companyInterface'

definePageMeta({
  layout: 'default'
})

const { $supabase } = useNuxtApp()
const route = useRoute()
const authStore = useAuthStore()

const tabs = [
  {
    label: 'About',
    icon: 'i-lucide-info',
    slot: 'about'
  },
  {
    label: 'Jobs',
    icon: 'i-lucide-briefcase-business',
    slot: 'jobs'
  },
  {
    label: 'Discussions',
    icon: 'i-lucide-messages-square',
    slot: 'discussions'
  }
]

const company = ref<Company | null>(null)
const loading = ref(true)
const companyError = ref('')

const companyStats = ref({
  activeJobs: 0,
  latestJobDate: null as string | null,
  topTags: [] as string[],
  salaryMin: null as number | null,
  salaryMax: null as number | null,
  salaryCurrency: null as string | null
})

const buildCompanyStats = (jobs: any[] = [], count = 0) => {
  const tagCounts = new Map<string, number>()
  let latestJobDate: string | null = null
  let salaryMin: number | null = null
  let salaryMax: number | null = null
  let salaryCurrency: string | null = null

  for (const job of jobs) {
    if (job.created_at && (!latestJobDate || new Date(job.created_at) > new Date(latestJobDate))) {
      latestJobDate = job.created_at
    }

    if (Array.isArray(job.tags)) {
      for (const tag of job.tags) {
        if (!tag) continue
        const normalizedTag = tag.toString().trim()
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
      }
    }

    if (typeof job.salary_min === 'number') {
      salaryMin = salaryMin === null ? job.salary_min : Math.min(salaryMin, job.salary_min)
    }

    if (typeof job.salary_max === 'number') {
      salaryMax = salaryMax === null ? job.salary_max : Math.max(salaryMax, job.salary_max)
    }

    if (!salaryCurrency && job.currency) {
      salaryCurrency = job.currency
    }
  }

  companyStats.value = {
    activeJobs: count || jobs.length,
    latestJobDate,
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag),
    salaryMin,
    salaryMax,
    salaryCurrency
  }
}

const fetchCompany = async () => {
  loading.value = true
  companyError.value = ''

  try {
    const [{ data, error }, statsResponse] = await Promise.all([
      $supabase.schema('companies')
        .from('company')
        .select('*')
        .eq('id', route.params.id)
        .single(),
      $supabase.schema('jobs')
        .from('job_with_company_info')
        .select('id, created_at, tags', { count: 'exact' })
        .eq('company_id', route.params.id)
        .order('created_at', { ascending: false })
    ])

    if (error) throw error

    company.value = data
    if (statsResponse.error) {
      console.error('Error fetching company hiring stats:', statsResponse.error)
      buildCompanyStats()
      return
    }

    buildCompanyStats(statsResponse.data || [], statsResponse.count || 0)
  } catch (error: any) {
    console.error('Error fetching company data:', error)
    company.value = null
    companyError.value = error?.message || 'Unable to load this company right now.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCompany)
</script>
