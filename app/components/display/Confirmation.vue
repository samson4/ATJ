<template>
<UModal >
     <template #content>
  <UCard class="p-6">
    <h2 class="text-2xl font-semibold mb-4">Confirmation</h2>
    <p class="text-gray-700">Are you sure you want to proceed with this action?</p>
    <div class="mt-6 flex justify-end gap-4">
      <UButton variant="outline" @click="$emit('close')">Cancel</UButton>
      <UButton :disabled="disabled" color="primary" @click="disabled = true; $emit('confirm')">Confirm</UButton>
    </div>
    </UCard>
    </template>
    </UModal>
    
</template>

<script setup lang="ts">
const props = defineProps({
})

const disabled = ref(false)
</script>

<style>

</style>