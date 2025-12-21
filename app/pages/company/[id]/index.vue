<template>
  <UPage>
   
      <div class="flex justify-center gap-8">
        <!-- Left Sidebar: Company Info -->
        <UPageAside class="w-1/3 lg:w-1/3 md:w-1/3 sm:w-full xs:w-full">
          <div>
            <CompanyInfo v-if="company" :company="company"/>
          </div>
        </UPageAside>

        <!-- Main Content: Jobs From Company -->
        <div class="flex-1  mt-8">
          

            <UTabs class="w-2/3" :unmount-on-hide="false" :items="tabs" variant="link">
    <template #jobs>
      <JobsFromCompany />
    </template>

    <template #discussions>
     <CompanyDiscussions v-if="company && authStore.authenticated_user && authStore.authenticated_user.id" :company="company"/>
     <p v-else class="text-center text-gray-500 mt-8">Please sign in to view and participate in discussions.</p>
    </template>
  </UTabs>


          
        </div>
      </div>
    
  </UPage>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Company } from '~/interfaces/companyInterface'
// No script needed here for layout
definePageMeta({
  layout: 'default'
})
const { $supabase } = useNuxtApp()
const route = useRoute()
const authStore = useAuthStore()
const tabs = [
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
onMounted(async () => {
  const { data, error } = await $supabase.schema("companies")
    .from('company')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    console.error('Error fetching company data:', error)
  } else {
    company.value = data
  }
})
</script>

<style>
/* Add any additional custom styles here if needed */
</style>