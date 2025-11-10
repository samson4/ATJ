<template>
  <template>
  <UBlogPosts orientation="vertical" :posts="companies" />
</template>


</template>

<script setup lang="ts">
//init
const { $supabase } = useNuxtApp()
//data
const companies = ref([
])

//hooks
onMounted(async()=>{
 
const { data, error } = await $supabase.schema("companies")
  .from('company')
  .select(`
    *
  `)
  if(error) throw error
   companies.value = data.map((d)=>{
    return {
      title: d.name,
      description:d.description,
      image: 'https://nuxt.com/assets/blog/v3.13.png',
      date: '2024-08-22',
      to:`company/${d.id}`
    }
  })

})
</script>

<style>

</style>