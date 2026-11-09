<template>
  <div
    class="dashboard-property-field-editor ml-0.5 border-b border-white/5 py-1.5 pr-1 transition-colors"
    :class="[
      isNumberValue || props.half ? 'col-span-1' : 'col-span-2',
      readonly
        ? 'border-l-2 border-l-transparent'
        : isActive
          ? 'group border-l-2 border-l-[#6B7A4A] hover:bg-white/2.5'
          : 'group border-l-2 border-l-transparent hover:bg-white/2.5',
    ]"
  >
    <!-- Boolean: toggle inline -->
    <template v-if="isBooleanValue">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        :aria-label="`${label} : ${modelValue ? 'oui' : 'non'}, cliquer pour basculer`"
        @click="emitUpdate(!modelValue)"
      >
        <span class="text-[0.65rem] font-semibold tracking-widest text-white/20">
          {{ label }}
        </span>
        <span
          class="text-xs font-medium transition-colors"
          :class="modelValue ? 'text-[#6B7A4A]' : 'text-white/30'"
        >
          {{ modelValue ? 'Oui' : 'Non' }}
        </span>
      </button>
    </template>

    <!-- Number -->
    <template v-else-if="isNumberValue">
      <p class="mb-1 text-[0.65rem] font-semibold tracking-widest text-white/20">
        {{ label }}
      </p>
      <input
        v-if="isActive"
        ref="inputRef"
        type="number"
        class="w-full bg-transparent text-sm text-white caret-white outline-none"
        :value="modelValue"
        :aria-label="label"
        @input="updateNumber(($event.target as HTMLInputElement).value)"
        @blur="isActive = false"
        @keydown.escape="isActive = false"
        @keydown.enter="isActive = false"
      />
      <button
        v-else
        type="button"
        class="w-full text-left text-sm transition-colors hover:text-white/80"
        :class="numberDisplayValue !== '—' ? 'text-white/65' : 'text-white/25'"
        :aria-label="`Modifier ${label}`"
        @click="activate"
      >
        {{ numberDisplayValue }}
      </button>
    </template>

    <!-- String -->
    <template v-else-if="isStringLikeValue">
      <p class="mb-1 text-[0.65rem] font-semibold tracking-widest text-white/20">
        {{ label }}
      </p>
      <p v-if="readonly" class="text-sm font-semibold" style="color: #6b7a4a">
        {{ stringDisplayValue }}
      </p>
      <template v-else-if="isActive">
        <textarea
          v-if="shouldUseTextarea"
          ref="inputRef"
          class="w-full resize-none bg-transparent text-sm leading-relaxed text-white caret-white outline-none"
          :value="stringValue"
          :rows="textareaRows"
          :aria-label="label"
          @input="updateString(($event.target as HTMLTextAreaElement).value)"
          @blur="isActive = false"
          @keydown.escape="isActive = false"
        />
        <input
          v-else
          ref="inputRef"
          type="text"
          class="w-full bg-transparent text-sm text-white caret-white outline-none"
          :value="stringValue"
          :aria-label="label"
          @input="updateString(($event.target as HTMLInputElement).value)"
          @blur="isActive = false"
          @keydown.escape="isActive = false"
          @keydown.enter="isActive = false"
        />
      </template>
      <button
        v-else
        type="button"
        class="w-full text-left text-sm transition-colors hover:text-white/80"
        :class="stringDisplayValue !== '—' ? 'text-white/65' : 'text-white/25'"
        :aria-label="`Modifier ${label}`"
        @click="activate"
      >
        <span class="line-clamp-2">{{ stringDisplayValue }}</span>
      </button>
    </template>

    <!-- Scalar array: chips + textarea -->
    <template v-else-if="isArrayValue && isScalarArray">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        :aria-label="label"
        @click="toggleActive"
      >
        <span class="text-[0.65rem] font-semibold tracking-widest text-white/20">
          {{ label }}
        </span>
        <span class="text-[0.65rem] text-white/25">{{ modelArray.length }}</span>
      </button>
      <div v-if="isActive" class="mt-2">
        <textarea
          ref="inputRef"
          class="w-full resize-none bg-transparent text-sm text-white caret-white outline-none"
          :value="arrayTextValue"
          :rows="Math.max(3, Math.min(8, modelArray.length + 1))"
          :aria-label="label"
          @input="updateScalarArray(($event.target as HTMLTextAreaElement).value)"
          @blur="isActive = false"
          @keydown.escape="isActive = false"
        />
      </div>
      <div v-else-if="modelArray.length" class="mt-1.5 flex flex-wrap gap-1">
        <span
          v-for="(item, i) in modelArray.slice(0, 5)"
          :key="i"
          class="rounded px-1.5 py-0.5 text-[0.6rem] text-white/50"
          style="background-color: rgba(255, 255, 255, 0.06)"
          >{{ item }}</span
        >
        <span v-if="modelArray.length > 5" class="self-center text-[0.6rem] text-white/25">
          +{{ modelArray.length - 5 }}
        </span>
      </div>
    </template>

    <!-- Complex array or object: JSON expandable -->
    <template v-else>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        :aria-label="label"
        @click="toggleActive"
      >
        <span class="text-[0.65rem] font-semibold tracking-widest text-white/20">
          {{ label }}
        </span>
        <UIcon
          :name="isActive ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="shrink-0 text-xs text-white/25"
          aria-hidden="true"
        />
      </button>
      <div v-if="isActive" class="mt-2">
        <textarea
          ref="inputRef"
          class="w-full resize-none bg-transparent font-mono text-xs text-white caret-white outline-none"
          :value="jsonTextValue"
          :rows="12"
          :aria-label="label"
          @input="updateJson(($event.target as HTMLTextAreaElement).value)"
          @blur="isActive = false"
          @keydown.escape="isActive = false"
        />
      </div>
    </template>

    <p v-if="hint" class="mt-0.5 italic opacity-35" style="color: #6b7a4a; font-size: 8px">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

defineOptions({
  name: 'DashboardPropertyFieldEditor',
})

// 3. Props et emits
const props = defineProps<{
  label: string
  path: string
  modelValue: DashboardEditableValue
  readonly?: boolean
  half?: boolean
  zeroAsEmpty?: boolean
  hint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardEditableValue]
}>()

// 4. Composables, stores, routeur

// 5. Etat local
const isActive = ref(false)
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

// 6. Data inputs

// 7. Validation et helpers purs
const isScalar = (value: DashboardEditableValue): boolean =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const emitUpdate = (value: DashboardEditableValue): void => {
  emit('update:modelValue', value)
}

const toEditableValue = (value: unknown): DashboardEditableValue => {
  if (value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => toEditableValue(item))
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toEditableValue(item)]),
    )
  }

  return null
}

// 8. Computed UI-ready
const isBooleanValue = computed<boolean>(() => typeof props.modelValue === 'boolean')
const isNumberValue = computed<boolean>(() => typeof props.modelValue === 'number')
const isStringLikeValue = computed<boolean>(
  () => typeof props.modelValue === 'string' || props.modelValue === null,
)
const isArrayValue = computed<boolean>(() => Array.isArray(props.modelValue))

const stringValue = computed<string>(() =>
  typeof props.modelValue === 'string' ? props.modelValue : '',
)

const stringDisplayValue = computed<string>(() => {
  const value = stringValue.value.trim()
  if (!value) return '—'
  if (props.zeroAsEmpty && value === '0') return '—'
  return stringValue.value
})

const numberDisplayValue = computed<string>(() => {
  if (props.modelValue === null) return '—'
  if (props.zeroAsEmpty && props.modelValue === 0) return '—'
  return String(props.modelValue)
})

const shouldUseTextarea = computed<boolean>(() => {
  return stringValue.value.includes('\n') || stringValue.value.length > 90
})

const textareaRows = computed<number>(() => {
  const lineCount = stringValue.value.split('\n').length
  return Math.max(3, Math.min(10, lineCount + 1))
})

const modelArray = computed<DashboardEditableValue[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
)

const isScalarArray = computed<boolean>(() => modelArray.value.every(isScalar))

const arrayTextValue = computed<string>(() =>
  modelArray.value
    .map((value) => {
      if (value === null) return ''
      return String(value)
    })
    .join('\n'),
)

const jsonTextValue = computed<string>(() => JSON.stringify(props.modelValue, null, 2))

// 9. Actions et handlers
const activate = async (): Promise<void> => {
  isActive.value = true
  await nextTick()
  inputRef.value?.focus()
}

const toggleActive = async (): Promise<void> => {
  isActive.value = !isActive.value
  if (isActive.value) {
    await nextTick()
    inputRef.value?.focus()
  }
}

const updateString = (value: string | number): void => {
  emitUpdate(String(value))
}

const updateNumber = (value: string | number): void => {
  const parsed = Number(value)
  emitUpdate(Number.isFinite(parsed) ? parsed : 0)
}

const updateScalarArray = (value: string | number): void => {
  emitUpdate(
    String(value)
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )
}

const updateJson = (value: string | number): void => {
  try {
    emitUpdate(toEditableValue(JSON.parse(String(value))))
  } catch {
    // L'utilisateur peut laisser temporairement un JSON invalide pendant la saisie.
  }
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
