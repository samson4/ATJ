<script setup lang="ts">
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <template #right>
      <UColorModeButton />
    </template>
  </UHeader>

  <UMain>
    <slot />
  </UMain>

  <AppFooter />
</template>
