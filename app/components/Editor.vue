<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

withDefaults(defineProps<{ placeholder?: string, minHeight?: string }>(), {
  placeholder: 'Start writing…',
  minHeight: '8rem'
})

const model = defineModel<string>({ default: '' })
const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', 'aria-label': 'Underline', tooltip: { text: 'Underline' } }
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list', tooltip: { text: 'Bullet list' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list', tooltip: { text: 'Numbered list' } }
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': 'Undo', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': 'Redo', tooltip: { text: 'Redo' } }
  ]
]
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    v-model="model"
    content-type="html"
    :placeholder="placeholder"
    :image="false"
    :mention="false"
    :ui="{
      root: 'overflow-hidden rounded-md border border-default bg-default focus-within:ring-2 focus-within:ring-primary/50',
      content: 'px-3 py-3',
      base: 'max-w-none px-0 text-sm text-default'
    }"
    :style="{ '--editor-min-height': minHeight }"
    class="[&_.ProseMirror]:min-h-[var(--editor-min-height)]"
  >
    <UEditorToolbar
      :editor="editor"
      :items="toolbarItems"
      class="overflow-x-auto border-b border-default bg-elevated/50 px-2 py-1.5"
    />
  </UEditor>
</template>
