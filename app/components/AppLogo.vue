<script setup>

const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  }
})
</script>

<template>
<p>{{ mode }}</p>
<img v-if="isDark" src="/logo-dark.png" class="w-25 max-w-full" />
<img v-else src="/logo.png"  class="w-25 max-w-full"/>
</template>