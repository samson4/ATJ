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

  <USeparator />

  <UFooter>
    <template #left>
      <p class="text-sm text-muted">
        Addis Tech Jobs • © {{ new Date().getFullYear() }}
      </p>
    </template>
  </UFooter>
</template>

<script setup lang="ts">

</script>

<style>

</style>
