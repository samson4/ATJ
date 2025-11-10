<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { marked } from 'marked';
const schema = z.object({
  name: z.string().min(2, "Too short"),
  email: z.string().email("Invalid email"),
});

const props = defineProps({
  job: {
    type: Object,
    default: {},
  },
});
const open = ref(false);

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Success",
    description: `New customer ${event.data.name} added`,
    color: "success",
  });
  open.value = false;
}
</script>

<template>
  <UModal
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-3xl' }"
    v-model:open="open"
  >
    <UButton
      icon="i-heroicons-arrow-right-20-solid"
      trailing
      color="primary"
      variant="solid"
    >
      Read more
    </UButton>

    <template #header>
  <div v-if="job" class="flex  justify-between gap-4">
    <!-- Left Side: Job Role and Company -->
    <div class="flex items-start gap-4">
      <UAvatar :src="job.company_logo" :alt="job.company_name" size="lg" />
      <div class="flex-1">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ job.role }}
        </h2>
        <p class="text-base text-gray-500 dark:text-gray-400">
          at {{ job.company_name }}
        </p>
         <p class="text-sm text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-map-pin" class="inline-block mr-1" />
        {{ job.workplace }}
      </p>
      </div>
     
    </div>

    <!-- Right Side: Workplace -->
   
  </div>
</template>

    <template #body>
      <UCard variant="subtle">
        <!-- Modal Header -->

        <!-- Modal Body -->
        <div v-if="job" class="prose dark:prose-invert max-w-none">
          

          <div v-html="marked.parse(job.job_description)"></div>

        </div>

        <!-- Modal Footer -->
        <template #footer>
          <div class="flex justify-end items-center gap-2">
            <UButton variant="outline" color="neutral" @click="open = false">
              Close
            </UButton>
            <UButton
               :to="job.link.startsWith('mailto:') ? job.link : job.link.includes('@') ? `mailto:${job.link}` : job.link"
              target="_blank"
              icon="i-heroicons-arrow-top-right-on-square"
              trailing
            >
              Apply Now
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
