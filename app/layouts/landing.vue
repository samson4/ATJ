<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <template #right>
      <UButton to="/auth/signin" color="secondary" variant="outline">Sign In</UButton>
      <UColorModeButton />
    </template>
  </UHeader>

  <UMain>
    <slot />
  </UMain>

  <AppFooter />
</template>

<script setup lang="ts">

</script>

<style>

</style>
