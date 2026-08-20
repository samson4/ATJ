<template>
  <section
    v-if="loading || similarCompanies.length"
    :class="sectionClass"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm font-medium text-primary">
          <UIcon name="i-lucide-git-compare-arrows" class="size-4" />
          <span>Similar Companies</span>
        </div>
        <h2 class="mt-1 text-xl font-semibold text-highlighted">
          Explore companies hiring for similar roles
        </h2>
      </div>
    </div>

    <UScrollArea
      v-slot="{ item }"
      :items="scrollItems"
      orientation="vertical"
      virtualize
      class="w-full data-[orientation=vertical]:h-[600px] data-[orientation=horizontal]:h-[300px] "
    >
      <UCard
        v-if="isLoadingItem(item)"
        class="rounded-md"
      >
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <USkeleton class="size-12 rounded-md" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-36" />
              <USkeleton class="h-4 w-24" />
            </div>
          </div>
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
          <div class="flex gap-2">
            <USkeleton class="h-6 w-16 rounded-full" />
            <USkeleton class="h-6 w-20 rounded-full" />
          </div>
        </div>
      </UCard>

      <NuxtLink
        v-else
        :to="`/company/${item.company_id}`"
        class="group block"
      >
        <UCard class=" h-full transition-colors group-hover:border-primary group-hover:bg-primary/5 my-2">
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <UAvatar
                :src="item.company_logo"
                :alt="item.company_name"
                icon="i-lucide-building-2"
                size="lg"
                class="rounded-md"
              />

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate font-semibold text-highlighted">
                      {{ item.company_name }}
                    </h3>
                    <p class="mt-1 text-sm text-muted">
                      {{ item.industry || item.headquarters || 'Company profile' }}
                    </p>
                  </div>
                  <UBadge color="neutral" variant="soft">
                    {{ formatJobs(item.active_jobs) }}
                  </UBadge>
                </div>
              </div>
            </div>

            <p class="line-clamp-2 text-sm leading-6 text-toned">
              {{ item.company_description || 'Hiring for roles with similar skills and responsibilities.' }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </UScrollArea>
  </section>
</template>

<script setup lang="ts">
interface SimilarCompany {
  company_id: string
  company_name: string
  company_logo: string | null
  company_website: string | null
  company_description: string | null
  industry: string | null
  employee_count: number | null
  headquarters: string | null
  active_jobs: number
  shared_tags: string[]
  shared_role_terms: string[]
  similarity_score: number
}

interface LoadingCompany {
  id: number
  loading: true
}

const props = defineProps<{
  companyId?: string | null
  layout?: 'default' | 'rail'
}>()

const { $supabase } = useNuxtApp()
const loading = ref(false)
const similarCompanies = ref<SimilarCompany[]>([])

const sectionClass = computed(() => props.layout === 'rail'
  ? 'w-full max-w-[480px] min-w-0 space-y-4'
  : 'w-full min-w-0 space-y-4'
)

const loadingItems = Array.from({ length: 3 }, (_, index) => ({
  id: index + 1,
  loading: true
}))

const scrollItems = computed<Array<SimilarCompany | LoadingCompany>>(() =>
  loading.value ? loadingItems : similarCompanies.value
)

const isLoadingItem = (item: SimilarCompany | LoadingCompany): item is LoadingCompany =>
  'loading' in item

const formatJobs = (count?: number | null) => {
  const total = count || 0
  return `${total} role${total === 1 ? '' : 's'}`
}

const fetchSimilarCompanies = async (companyId?: string | null) => {
  if (!companyId) {
    similarCompanies.value = []
    return
  }

  loading.value = true

  try {
    const { data, error } = await $supabase
      .schema('jobs')
      .rpc('similar_companies_for_company', {
        p_company_id: companyId,
        p_limit: 6
      })

    if (error) throw error

    similarCompanies.value = (data || []).map((company: any) => ({
      ...company,
      active_jobs: Number(company.active_jobs || 0),
      similarity_score: Number(company.similarity_score || 0),
      shared_tags: Array.isArray(company.shared_tags) ? company.shared_tags : [],
      shared_role_terms: Array.isArray(company.shared_role_terms) ? company.shared_role_terms : []
    }))
  } catch (error) {
    console.error('Error fetching similar companies:', error)
    similarCompanies.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.companyId,
  (companyId) => fetchSimilarCompanies(companyId),
  { immediate: true }
)
</script>
