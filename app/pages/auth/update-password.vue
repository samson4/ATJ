<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
<UPageCard class="w-full max-w-md">
    <UAuthForm
        title="Update Your Password"
        description="Please enter your new password below."
        icon="i-lucide-lock"
        :schema="schema"
        :fields="fields"
        :submit-label="'Update Password'"
        @submit="updatePassword"
      >
    </UAuthForm>
    </UPageCard>
  </div>

</template>

<script setup lang="ts">
    

</script>

<style>

</style>