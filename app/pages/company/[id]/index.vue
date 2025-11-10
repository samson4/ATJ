<template>
  <UPage>
   
      <div class="flex gap-8">
        <!-- Left Sidebar: Company Info -->
        <UPageAside class="w-1/3 lg:w-1/3">
          <div>
            <CompanyInfo v-if="company" :company="company"/>
          </div>
        </UPageAside>

        <!-- Main Content: Jobs From Company -->
        <div class="flex-1 mt-8">
          

            <UTabs :unmount-on-hide="false" :items="tabs" variant="link">
    <template #jobs>
      <JobsFromCompany />
    </template>

    <template #discussions>
     <CompanyDiscussions v-if="company" :company="company"/>
    </template>
  </UTabs>


          
        </div>
      </div>
    
  </UPage>
</template>

<script setup lang="ts">


// No script needed here for layout
definePageMeta({
  layout: 'default'
})
const { $supabase } = useNuxtApp()
const route = useRoute()
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




interface Company {
  id: string;
  created_at: string;
  update_at: string;
  name: string;
  website: string;
  description: string;
  logo: string;
}

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