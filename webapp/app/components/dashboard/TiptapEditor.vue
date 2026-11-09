<template>
  <div class="flex flex-col overflow-hidden rounded border border-white/10">
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-2 py-1.5"
      style="background-color: rgba(255, 255, 255, 0.03)"
    >
      <template v-for="(group, gi) in toolbarGroups" :key="gi">
        <div v-if="gi > 0" class="mx-1 h-4 w-px bg-white/10" />
        <button
          v-for="item in group"
          :key="item.name"
          type="button"
          class="rounded p-1 text-white/35 transition-colors hover:bg-white/8 hover:text-white/65 disabled:cursor-not-allowed disabled:opacity-30"
          :class="{ 'bg-white/8': item.isActive?.() }"
          :style="item.isActive?.() ? 'color: #6B7A4A' : ''"
          :disabled="item.disabled?.()"
          :title="item.label"
          @click="item.action()"
        >
          <UIcon :name="item.icon" class="text-sm" />
        </button>
      </template>
    </div>

    <TiptapEditorContent :editor="editor" class="dashboard-tiptap min-h-48" />
  </div>
</template>

<script setup lang="ts">
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

const toHtml = (markdown: string): string => md.render(markdown)

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  extensions: [TiptapStarterKit, Markdown, Table, TableRow, TableCell, TableHeader],
  content: toHtml(props.modelValue),
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getMarkdown())
  },
})

type ToolbarItem = {
  name: string
  label: string
  icon: string
  isActive?: () => boolean
  disabled?: () => boolean
  action: () => boolean | undefined
}

const toolbarGroups = computed<ToolbarItem[][]>(() => [
  [
    {
      name: 'bold',
      label: 'Gras',
      icon: 'i-lucide-bold',
      isActive: () => editor.value?.isActive('bold') ?? false,
      disabled: () => !editor.value?.can().toggleBold(),
      action: () => editor.value?.chain().focus().toggleBold().run(),
    },
    {
      name: 'italic',
      label: 'Italique',
      icon: 'i-lucide-italic',
      isActive: () => editor.value?.isActive('italic') ?? false,
      disabled: () => !editor.value?.can().toggleItalic(),
      action: () => editor.value?.chain().focus().toggleItalic().run(),
    },
    {
      name: 'strike',
      label: 'Barré',
      icon: 'i-lucide-strikethrough',
      isActive: () => editor.value?.isActive('strike') ?? false,
      disabled: () => !editor.value?.can().toggleStrike(),
      action: () => editor.value?.chain().focus().toggleStrike().run(),
    },
  ],
  [
    {
      name: 'h2',
      label: 'Titre H2',
      icon: 'i-lucide-heading-2',
      isActive: () => editor.value?.isActive('heading', { level: 2 }) ?? false,
      action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      name: 'h3',
      label: 'Titre H3',
      icon: 'i-lucide-heading-3',
      isActive: () => editor.value?.isActive('heading', { level: 3 }) ?? false,
      action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ],
  [
    {
      name: 'bulletList',
      label: 'Liste à puces',
      icon: 'i-lucide-list',
      isActive: () => editor.value?.isActive('bulletList') ?? false,
      action: () => editor.value?.chain().focus().toggleBulletList().run(),
    },
    {
      name: 'orderedList',
      label: 'Liste numérotée',
      icon: 'i-lucide-list-ordered',
      isActive: () => editor.value?.isActive('orderedList') ?? false,
      action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    },
    {
      name: 'blockquote',
      label: 'Citation',
      icon: 'i-lucide-quote',
      isActive: () => editor.value?.isActive('blockquote') ?? false,
      action: () => editor.value?.chain().focus().toggleBlockquote().run(),
    },
  ],
  [
    {
      name: 'table',
      label: 'Insérer un tableau',
      icon: 'i-lucide-table',
      isActive: () => editor.value?.isActive('table') ?? false,
      action: () =>
        editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
  ],
  [
    {
      name: 'undo',
      label: 'Annuler',
      icon: 'i-lucide-undo-2',
      disabled: () => !editor.value?.can().undo(),
      action: () => editor.value?.chain().focus().undo().run(),
    },
    {
      name: 'redo',
      label: 'Rétablir',
      icon: 'i-lucide-redo-2',
      disabled: () => !editor.value?.can().redo(),
      action: () => editor.value?.chain().focus().redo().run(),
    },
  ],
])

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return
    const current = editor.value.getMarkdown()
    if (current !== value) {
      editor.value.commands.setContent(toHtml(value))
    }
  },
)

onBeforeUnmount(() => {
  unref(editor)?.destroy()
})
</script>

<style>
.dashboard-tiptap .ProseMirror {
  padding: 0.75rem;
  min-height: 12rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  outline: none;
}

.dashboard-tiptap .ProseMirror h2 {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1rem;
  margin-bottom: 0.375rem;
}

.dashboard-tiptap .ProseMirror h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.dashboard-tiptap .ProseMirror p {
  margin-bottom: 0.5rem;
}

.dashboard-tiptap .ProseMirror p:last-child {
  margin-bottom: 0;
}

.dashboard-tiptap .ProseMirror strong {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.dashboard-tiptap .ProseMirror em {
  font-style: italic;
}

.dashboard-tiptap .ProseMirror s {
  text-decoration: line-through;
}

.dashboard-tiptap .ProseMirror ul,
.dashboard-tiptap .ProseMirror ol {
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}

.dashboard-tiptap .ProseMirror ul {
  list-style-type: disc;
}

.dashboard-tiptap .ProseMirror ol {
  list-style-type: decimal;
}

.dashboard-tiptap .ProseMirror li + li {
  margin-top: 0.125rem;
}

.dashboard-tiptap .ProseMirror blockquote {
  border-left: 2px solid #6b7a4a;
  padding-left: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  margin: 0.5rem 0;
}

.dashboard-tiptap .ProseMirror code {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 0.25rem;
  padding: 0.1em 0.3em;
  font-size: 0.8em;
  font-family: ui-monospace, monospace;
}

.dashboard-tiptap .ProseMirror pre {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.dashboard-tiptap .ProseMirror pre code {
  background: none;
  padding: 0;
  font-size: 0.8em;
}

.dashboard-tiptap .ProseMirror hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 1rem 0;
}

.dashboard-tiptap .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  float: left;
  height: 0;
}
</style>
