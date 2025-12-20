<template>
  <div class="space-y-4">
    <!-- Posted Within -->
    <div>
      <div class="text-sm font-semibold mb-2">Posted</div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="opt in postedOptions"
          :key="opt.value"
          @click="local.postedWithin = local.postedWithin === opt.value ? '' : opt.value"
          :class="buttonClass(local.postedWithin === opt.value)"
          class="px-3 py-1 rounded-full text-sm"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- Tags -->
    <div>
      <div class="text-sm font-semibold mb-2">Tags</div>
      <div class="flex gap-2 items-center">
        <input v-model="newTag" @keyup.enter="addTag" placeholder="Add tag and press Enter" class="px-3 py-2 border rounded-md text-sm w-full" />
        <UButton size="sm" @click="addTag">Add</UButton>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span v-for="t in local.tags" :key="t" class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <span>{{ t }}</span>
          <button @click="removeTag(t)" class="text-xs opacity-70">✕</button>
        </span>
      </div>
    </div>

    <!-- Workplace -->
    <div>
      <div class="text-sm font-semibold mb-2">Workplace</div>
      <div class="flex gap-2">
        <button
          v-for="w in workplaceOptions"
          :key="w"
          @click="toggleWorkplace(w)"
          :class="buttonClass(local.workplaceTypes.includes(w))"
          class="px-3 py-1 rounded-full text-sm"
        >{{ w }}</button>
      </div>
    </div>

    <!-- Employment Type -->
    <div>
      <div class="text-sm font-semibold mb-2">Employment Type</div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="e in employmentOptions"
          :key="e"
          @click="setEmploymentType(e)"
          :class="buttonClass(local.employmentType === e)"
          class="px-3 py-1 rounded-full text-sm"
        >{{ e }}</button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <UButton color="primary" @click="apply">Apply</UButton>
      <UButton variant="outline" @click="clearAll">Clear</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const props = defineProps<{ filters?: any }>()
const emit = defineEmits<('apply')[]>()

const postedOptions = [
  { label: '24h', value: '24h' },
  { label: '3d', value: '3d' },
  { label: '7d', value: '7d' },
  { label: '14d', value: '14d' },
  { label: '30d', value: '30d' },
]

const workplaceOptions = ['remote', 'onsite', 'hybrid']
const employmentOptions = ['Permanent', 'Consultant', 'Freelance', 'Contractual']

const local = reactive({
  postedWithin: props.filters?.postedWithin || '',
  tags: [...(props.filters?.tags || [])],
  workplaceTypes: [...(props.filters?.workplaceTypes || [])],
  employmentType: props.filters?.employmentType || ''
})

watch(() => props.filters, (v) => {
  if (!v) return
  local.postedWithin = v.postedWithin || ''
  local.tags = [...(v.tags || [])]
  local.workplaceTypes = [...(v.workplaceTypes || [])]
  local.employmentType = v.employmentType || ''
}, { deep: true })

const newTag = ref('')

function buttonClass(active:boolean){
  return active ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
}

function toggleWorkplace(t:string){
  const i = local.workplaceTypes.indexOf(t)
  if (i === -1) local.workplaceTypes.push(t)
  else local.workplaceTypes.splice(i,1)
}

function setEmploymentType(t:string){
  local.employmentType = local.employmentType === t ? '' : t
}

function addTag(){
  const v = newTag.value?.trim()
  if (v && !local.tags.includes(v)) local.tags.push(v)
  newTag.value = ''
}

function removeTag(t:string){
  local.tags = local.tags.filter(x => x !== t)
}

function apply(){
  emit('apply', { ...local })
}

function clearAll(){
  local.postedWithin = ''
  local.tags = []
  local.workplaceTypes = []
  local.employmentType = ''
  emit('apply', { ...local })
}
</script>

<style scoped>
/* keep styles minimal and tailwind-first; adjust if needed */
</style>
