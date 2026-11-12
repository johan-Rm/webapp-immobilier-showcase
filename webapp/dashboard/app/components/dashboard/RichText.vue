<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2" role="toolbar" :aria-label="t('editor.formatting')">
      <UButton
        :label="t('editor.bold')"
        :aria-pressed="editor?.isActive('bold')"
        variant="outline"
        @click="editor?.chain().focus().toggleBold().run()"
      />
      <UButton
        :label="t('editor.italic')"
        :aria-pressed="editor?.isActive('italic')"
        variant="outline"
        @click="editor?.chain().focus().toggleItalic().run()"
      />
      <UButton
        :label="t('editor.heading')"
        variant="outline"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <UButton
        :label="t('editor.bullets')"
        variant="outline"
        @click="editor?.chain().focus().toggleBulletList().run()"
      />
      <UButton
        :label="t('editor.numbered')"
        variant="outline"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      />
      <UButton
        :label="t('editor.unlink')"
        variant="outline"
        @click="editor?.chain().focus().unsetLink().run()"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <UInput v-model="href" :aria-label="t('editor.linkUrl')" />
      <UButton :label="t('editor.link')" variant="outline" @click="setLink" />
    </div>
    <EditorContent
      :editor="editor"
      class="border-default rounded-md border p-3 [&_.tiptap]:min-h-32 [&_.tiptap]:outline-none [&_h2]:text-xl [&_h2]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
    />
  </div>
</template>
<script setup lang="ts">
// 1. Imports — unique wrapper for Tiptap in this layer.
import type { RichTextDocument } from '#shared/types/saas/richText'
import type { JSONContent } from '@tiptap/core'

import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'

import { isEditorialLink } from '#shared/saas/links'
// 3. Model
const props = defineProps<{ disabled?: boolean }>()
const model = defineModel<RichTextDocument>({ required: true })
// 4. Composables
const { t } = useI18n()
// 5. State
const href = ref('')
// 7. Boundary adapter: retain only the contracted JSON nodes and attributes.
const documentValue = (node: JSONContent): RichTextDocument => {
  const clean = (value: JSONContent): object => {
    if (value.type === 'text')
      return {
        type: 'text',
        text: value.text ?? '',
        ...(value.marks?.length
          ? {
              marks: value.marks
                .filter((mark) => mark.type !== 'link' || isEditorialLink(mark.attrs?.href ?? ''))
                .map((mark) =>
                  mark.type === 'link'
                    ? { type: 'link', attrs: { href: mark.attrs!.href } }
                    : { type: mark.type },
                ),
            }
          : {}),
      }
    if (value.type === 'hardBreak') return { type: 'hardBreak' }
    return {
      type: value.type,
      ...(value.type === 'heading' ? { attrs: { level: value.attrs!.level } } : {}),
      content: (value.content ?? []).map(clean),
    }
  }
  return clean(node) as RichTextDocument
}
const editor = useEditor({
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      code: false,
      underline: false,
      trailingNode: false,
      heading: { levels: [2, 3, 4, 5, 6] },
      link: { openOnClick: false, autolink: false },
    }),
  ],
  content: model.value,
  editorProps: {
    attributes: { role: 'textbox', 'aria-label': t('editor.text'), 'aria-multiline': 'true' },
  },
  onUpdate: ({ editor: instance }) => {
    model.value = documentValue(instance.getJSON())
  },
})
// 9. Handlers
const setLink = () => {
  if (isEditorialLink(href.value)) editor.value?.chain().focus().setLink({ href: href.value }).run()
}
// 10. Watchers
watch(
  () => props.disabled,
  (value) => editor.value?.setEditable(!value),
)
watch(
  model,
  (value) => {
    if (
      editor.value &&
      JSON.stringify(documentValue(editor.value.getJSON())) !== JSON.stringify(value)
    )
      editor.value.commands.setContent(value, { emitUpdate: false })
  },
  { deep: true },
)
</script>
