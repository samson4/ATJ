<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Filters</h3>
        <UButton size="xs" variant="ghost" @click="reset">Reset</UButton>
      </div>
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">Company</label>
        <UInput v-model="local.companyName" placeholder="Company name" size="sm" />
      </div>

      <div>
        <label class="text-sm font-medium">Tags</label>
        <div class="mt-2 flex flex-wrap gap-2">
          <UButton
            v-for="tag in availableTags"
            :key="tag"
            size="sm"
            :variant="local.tags.includes(tag) ? 'solid' : 'outline'"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </UButton>
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Salary range (min / max)</label>
        <div class="flex gap-2 mt-2">
          <UInput v-model.number="local.salaryMin" type="number" placeholder="Min" size="sm" />
          <UInput v-model.number="local.salaryMax" type="number" placeholder="Max" size="sm" />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { watch, reactive } from 'vue'

const emit = defineEmits<{
  (e: 'change', filters: { companyName?: string; tags: string[]; salaryMin?: number; salaryMax?: number }): void
}>()

// basic tag list; adjust or make dynamic later
const availableTags = ['Frontend', 'Backend', 'DevOps', 'Design', 'Product', 'Fullstack']

const local = reactive({
  companyName: '',
  tags: [] as string[],
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
})

function toggleTag(tag: string) {
  const idx = local.tags.indexOf(tag)
  if (idx === -1) local.tags.push(tag)
  else local.tags.splice(idx, 1)
}

function reset() {
  local.companyName = ''
  local.tags = []
  local.salaryMin = undefined
  local.salaryMax = undefined
}

// emit on change
watch(
  () => ({ ...local }),
  (next) => {
    emit('change', {
      companyName: next.companyName?.trim() || undefined,
      tags: next.tags || [],
      salaryMin: next.salaryMin,
      salaryMax: next.salaryMax,
    })
  },
  { deep: true }
)
</script>
