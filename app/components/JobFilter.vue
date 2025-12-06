<template>
  <div class="w-full">
    <UCard class="shadow-lg">
      <div>
         
        <div class="grid grid-cols-3 gap-4 mb-4">
          
          <div>
            
            <div>
             
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tags
              </label>
              <USelectMenu
                v-model="filters.tags"
                :items="tagOptions"
                multiple
                placeholder="Select tags."
                searchable
                searchable-placeholder="Search tags."
                class="w-full"
              >
                <template #label>
                  <span v-if="filters.tags.length" class="truncate">
                    {{ filters.tags.length }} tag{{
                      filters.tags.length > 1 ? "s" : ""
                    }}
                    selected
                  </span>
                  <span v-else class="text-gray-400">Select tags...</span>
                </template>
              </USelectMenu>
              <!-- tags chips -->
              <div class="flex gap-2 mt-3 items-center">
                <UBadge
                  v-for="(tag, index) in filters.tags.slice(0, 5)"
                  :key="`tag-${index}-${tag}`"
                  color="primary"
                  variant="subtle"
                  class="cursor-pointer"
                  @click="removeTag(tag)"
                >
                  {{ tag }}
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
                </UBadge>

                <UBadge
                  v-if="filters.tags.length > 5"
                  color="neutral"
                  variant="outline"
                  class="ml-1"
                >
                  +{{ filters.tags.length - 5 }}
                </UBadge>
              </div>
            </div>
            <!-- Posted Date -->
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Posted Within
            </label>
            <USelectMenu :items="postedWithinOptions" placeholder="Any time" />
          </div>
          <!-- Employment Type -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Employment Type
            </label>
            <USelectMenu
              placeholder="Type"
              :items="employmentTypes"
            />
          </div>
        </div>

        <!-- Salary Range -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Salary Range
            </label>
            <span
              class="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              ${{ formatSalary(filters.salaryRange[0]) }} - ${{
                formatSalary(filters.salaryRange[1])
              }}
            </span>
          </div>
          <USlider
            v-model="filters.salaryRange"
            :min="0"
            :max="300000"
            :step="5000"
            size="md"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>$300k+</span>
          </div>
        </div>

        <!-- Experience Level -->
        <div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Experience Level
            </label>
            <USelectMenu
              :items="[...experienceLevels]"
              placeholder="Select experience levels"
            />
          </div>
        </div>

        <!-- Workplace Type -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
          >
            Workplace Type
          </label>
          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="type in workplaceTypes"
              :key="type.value"
              :variant="isWorkplaceSelected(type.value) ? 'solid' : 'outline'"
              :color="isWorkplaceSelected(type.value) ? 'primary' : 'neutral'"
              size="sm"
              block
              @click="toggleWorkplace(type.value)"
              class="justify-start"
            >
              <UIcon :name="type.icon" class="w-4 h-4 mr-2" />
              {{ type.label }}
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UButton block color="gray" variant="outline" @click="resetFilters">
            Reset
          </UButton>
          <UButton block color="primary" @click="applyFilters">
            Apply Filters
            <UBadge
              v-if="activeFilterCount > 0"
              color="white"
              variant="solid"
              size="xs"
              class="ml-2"
            >
              {{ activeFilterCount }}
            </UBadge>
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

// Filter state
const filters = ref({
  search: "",
  tags: [] as string[],
  salaryRange: [30000, 150000] as [number, number],
  experienceLevels: [] as string[],
  workplaceTypes: [] as string[],
  employmentType: "",
  postedWithin: "",
  companySize: [] as string[],
  benefits: [] as string[],
});

// Options
const tagOptions = [
  "JavaScript",
  "TypeScript",
  "Vue.js",
  "React",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "Rust",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST API",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Machine Learning",
  "DevOps",
];

const experienceLevels = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (2-5 years)" },
  { value: "senior", label: "Senior (5-10 years)" },
  { value: "lead", label: "Lead / Principal (10+ years)" },
];

const workplaceTypes = [
  { value: "remote", label: "Remote", icon: "i-heroicons-home" },
  { value: "onsite", label: "On-site", icon: "i-heroicons-building-office" },
  { value: "hybrid", label: "Hybrid", icon: "i-heroicons-arrows-right-left" },
  {
    value: "contractual",
    label: "Contract",
    icon: "i-heroicons-document-text",
  },
];

const employmentTypes = [
  { value: "", label: "Any" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const postedWithinOptions = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last week" },
  { value: "14d", label: "Last 2 weeks" },
  { value: "30d", label: "Last month" },
];

const companySizeOptions = [
  { value: "startup", label: "Startup (1-10)" },
  { value: "small", label: "Small (11-50)" },
  { value: "medium", label: "Medium (51-200)" },
  { value: "large", label: "Large (201-1000)" },
  { value: "enterprise", label: "Enterprise (1000+)" },
];

const benefitOptions = [
  { value: "health", label: "Health Insurance" },
  { value: "401k", label: "401(k) Match" },
  { value: "pto", label: "Unlimited PTO" },
  { value: "equity", label: "Stock Options/Equity" },
  { value: "remote-stipend", label: "Remote Work Stipend" },
  { value: "learning", label: "Learning & Development" },
  { value: "gym", label: "Gym Membership" },
  { value: "parental", label: "Parental Leave" },
];

const benefitsAccordion = [{ label: "Benefits & Perks", slot: "benefits" }];

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.value.search !== "" ||
    filters.value.tags.length > 0 ||
    filters.value.salaryRange[0] !== 30000 ||
    filters.value.salaryRange[1] !== 150000 ||
    filters.value.experienceLevels.length > 0 ||
    filters.value.workplaceTypes.length > 0 ||
    filters.value.employmentType !== "" ||
    filters.value.postedWithin !== "" ||
    filters.value.companySize.length > 0 ||
    filters.value.benefits.length > 0
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  count += filters.value.tags.length;
  if (
    filters.value.salaryRange[0] !== 30000 ||
    filters.value.salaryRange[1] !== 150000
  )
    count++;
  count += filters.value.experienceLevels.length;
  count += filters.value.workplaceTypes.length;
  if (filters.value.employmentType) count++;
  if (filters.value.postedWithin) count++;
  count += filters.value.companySize.length;
  count += filters.value.benefits.length;
  return count;
});

// Methods
const formatSalary = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

const removeTag = (tag: string) => {
  filters.value.tags = filters.value.tags.filter((t) => t !== tag);
};

const isWorkplaceSelected = (value: string) => {
  return filters.value.workplaceTypes.includes(value);
};

const toggleWorkplace = (value: string) => {
  const index = filters.value.workplaceTypes.indexOf(value);
  if (index === -1) {
    filters.value.workplaceTypes.push(value);
  } else {
    filters.value.workplaceTypes.splice(index, 1);
  }
};

const resetFilters = () => {
  filters.value = {
    search: "",
    tags: [],
    salaryRange: [30000, 150000],
    experienceLevels: [],
    workplaceTypes: [],
    employmentType: "",
    postedWithin: "",
    companySize: [],
    benefits: [],
  };
};

const emit = defineEmits(["apply"]);

const applyFilters = () => {
  emit("apply", { ...filters.value });
};

// Expose filters for parent component access
defineExpose({
  filters,
  resetFilters,
});
</script>
