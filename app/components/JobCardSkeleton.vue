<template>
  <div class="h-screen overflow-y-auto space-y-3 p-2">
    <UCard v-for="i in 6" :key="i" class="p-4">
      <div class="flex gap-4">
        <USkeleton class="h-12 w-12 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-5 w-3/4" />
          <USkeleton class="h-4 w-5/6" />
          <div class="flex gap-2 mt-2">
            <USkeleton class="h-7 w-20 rounded" />
            <USkeleton class="h-7 w-16 rounded" />
            <USkeleton class="h-7 w-12 rounded" />
          </div>
          <div class="flex justify-between items-center mt-3">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-4 w-16" />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// minimal script; purely presentational skeleton
</script>
