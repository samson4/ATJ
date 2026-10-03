<script setup lang="ts">
import { resumeTemplates } from '~~/shared/data/resumeTemplates'
import type { ResumeDocument, ResumeTemplateKey } from '~~/shared/types/resume'
import { createResumeTemplatePreviewDocument, isResumeDocumentEmpty } from '~~/shared/utils/resume'

const model = defineModel<ResumeTemplateKey>({ required: true })
const props = defineProps<{ document?: ResumeDocument, loading?: boolean }>()
const usesSampleContent = computed(() => Boolean(props.document && isResumeDocumentEmpty(props.document)))
const previewDocument = computed(() => {
  if (!props.document) return undefined
  return usesSampleContent.value ? createResumeTemplatePreviewDocument() : props.document
})
const { previews, generate, retry } = useResumeTemplatePreviews(previewDocument, model)

watch(previewDocument, (document) => {
  if (document) void generate()
}, { immediate: true })

function retryFailedPreview(templateKey: ResumeTemplateKey) {
  if (previews[templateKey].status === 'error') void retry(templateKey)
}
</script>

<template>
  <fieldset>
    <legend class="text-sm font-medium text-default">Template</legend>
    <p v-if="document || loading" class="mb-3 mt-1 text-xs text-muted">
      <template v-if="loading">Preparing personalized previews…</template>
      <template v-else-if="usesSampleContent">Your resume is empty, so previews use sample content. It will not be added to your resume.</template>
      <template v-else>Previewed with your current resume. Only the first page is shown.</template>
    </p>
    <div v-else class="mb-3" />
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label
        v-for="template in resumeTemplates"
        :key="template.key"
        class="group relative cursor-pointer rounded-lg"
        @click="retryFailedPreview(template.key)"
      >
        <input
          v-model="model"
          type="radio"
          name="resume-template"
          :value="template.key"
          class="peer sr-only"
        >
        <span
          class="flex h-full flex-col rounded-lg border border-muted bg-default p-3 transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary group-hover:bg-elevated/50"
        >
          <span class="relative mb-3 flex aspect-[210/297] items-center justify-center overflow-hidden rounded-md bg-elevated p-2">
            <USkeleton
              v-if="loading || (document && ['idle', 'loading'].includes(previews[template.key].status))"
              class="absolute inset-2"
            />
            <img
              v-else-if="document && previews[template.key].status === 'ready'"
              :src="previews[template.key].imageUrl"
              :alt="`${template.name} template showing ${usesSampleContent ? 'sample content' : 'your resume'}`"
              class="h-full w-full rounded-sm bg-white object-contain shadow-sm"
            >
            <span
              v-else-if="document && previews[template.key].status === 'error'"
              class="flex flex-col items-center gap-2 px-3 text-center"
            >
              <UIcon name="i-lucide-file-warning" class="size-6 text-error" />
              <span class="text-xs text-muted">Preview unavailable</span>
              <span class="text-xs font-medium text-default">Select to retry</span>
            </span>
            <span v-else class="template-preview" :data-template="template.key" aria-hidden="true">
              <span class="preview-name" />
              <span class="preview-headline" />
              <span class="preview-contact" />
              <span v-for="section in 3" :key="section" class="preview-section">
                <span class="preview-heading" />
                <span class="preview-row preview-row-long" />
                <span class="preview-row" />
              </span>
            </span>
            <UBadge
              v-if="usesSampleContent && previews[template.key].status === 'ready'"
              label="Sample"
              color="neutral"
              variant="solid"
              size="sm"
              class="absolute left-3 top-3 shadow"
            />
            <UBadge
              v-if="document && previews[template.key].pageCount > 1"
              :label="`${previews[template.key].pageCount} pages`"
              color="neutral"
              variant="solid"
              size="sm"
              class="absolute bottom-3 right-3 shadow"
            />
          </span>
          <span class="flex items-start justify-between gap-2">
            <span>
              <span class="block text-sm font-semibold text-highlighted">{{ template.name }}</span>
              <span class="mt-1 block text-xs leading-4 text-muted">{{ template.description }}</span>
            </span>
            <UIcon
              v-if="model === template.key"
              name="i-lucide-circle-check"
              class="mt-0.5 size-5 shrink-0 text-primary"
            />
          </span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.template-preview {
  display: flex;
  width: 7rem;
  height: 9.9rem;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #000;
  background: #fff;
  color: #000;
  padding: 0.65rem;
}

.template-preview span {
  display: block;
  background: currentColor;
}

.preview-name { width: 58%; height: 5px; }
.preview-headline { width: 42%; height: 2px; margin-top: 4px; }
.preview-contact { width: 72%; height: 1px; margin-top: 5px; }
.preview-section { margin-top: 10px; background: transparent !important; }
.preview-heading { width: 34%; height: 3px; margin-bottom: 4px; }
.preview-row { width: 68%; height: 1px; margin-top: 3px; }
.preview-row-long { width: 96%; }

[data-template="ats-classic"] .preview-heading {
  width: 100%;
  border-bottom: 1px solid #000;
  background: transparent;
}

[data-template="modern-minimal"] { padding: 0.8rem; }
[data-template="modern-minimal"] .preview-name { width: 72%; height: 8px; }
[data-template="modern-minimal"] .preview-section { margin-top: 13px; }
[data-template="modern-minimal"] .preview-heading { width: 42%; height: 4px; }

[data-template="centered-professional"] { align-items: center; }
[data-template="centered-professional"] .preview-name,
[data-template="centered-professional"] .preview-headline,
[data-template="centered-professional"] .preview-contact { margin-inline: auto; }
[data-template="centered-professional"] .preview-section { width: 100%; }
[data-template="centered-professional"] .preview-heading { width: 45%; margin-inline: auto; }

[data-template="executive"] { border-width: 2px; }
[data-template="executive"] .preview-name { width: 78%; height: 7px; }
[data-template="executive"] .preview-contact { width: 100%; border-bottom: 2px double #000; background: transparent; }
[data-template="executive"] .preview-heading { width: 100%; border-top: 2px double #000; background: transparent; }

[data-template="compact"] { padding: 0.45rem; }
[data-template="compact"] .preview-section { margin-top: 6px; }
[data-template="compact"] .preview-heading { height: 2px; }
[data-template="compact"] .preview-row { margin-top: 2px; }

[data-template="structured"] .preview-name { width: 68%; }
[data-template="structured"] .preview-heading {
  width: 100%;
  height: 8px;
  border: 1px solid #000;
  background: transparent;
}
[data-template="structured"] .preview-row:last-child { padding-bottom: 4px; border-bottom: 1px solid #000; background: transparent; }
</style>
