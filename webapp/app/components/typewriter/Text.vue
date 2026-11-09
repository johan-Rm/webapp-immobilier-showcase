<template>
  <span>
    {{ text }}
    <span v-if="caret" class="ml-1 inline-block animate-pulse">|</span>
  </span>
</template>

<script setup lang="ts">
// 1. Imports
import { ref, onMounted, onUnmounted, watch } from 'vue'

// 2. Types et constantes statiques
interface Props {
  phrases: string[]
  typeSpeed?: number
  deleteSpeed?: number
  pause?: number
  loop?: boolean
  deleteBeforeNext?: boolean
  caret?: boolean
}

// 3. Props et emits
const props = withDefaults(defineProps<Props>(), {
  typeSpeed: 40,
  deleteSpeed: 25,
  pause: 1200,
  loop: true,
  deleteBeforeNext: true,
  caret: true,
})

// 4. Composables, stores, routeur

// 5. Etat local
const text = ref('')

const phraseIndex = ref(0)

const charIndex = ref(0)

const deleting = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const clear = () => {
  if (timer) clearTimeout(timer)
}

const step = () => {
  const current = props.phrases[phraseIndex.value] ?? ''

  if (!deleting.value) {
    if (charIndex.value < current.length) {
      text.value += current[charIndex.value++]
      timer = setTimeout(step, props.typeSpeed)
    } else {
      if (!props.deleteBeforeNext) {
        timer = setTimeout(nextPhrase, props.pause)
      } else {
        timer = setTimeout(() => {
          deleting.value = true
          step()
        }, props.pause)
      }
    }
  } else {
    if (text.value.length > 0) {
      text.value = text.value.slice(0, -1)
      timer = setTimeout(step, props.deleteSpeed)
    } else {
      deleting.value = false
      nextPhrase()
    }
  }
}

const nextPhrase = () => {
  phraseIndex.value++
  if (phraseIndex.value >= props.phrases.length) {
    if (!props.loop) return
    phraseIndex.value = 0
  }
  charIndex.value = 0
  step()
}

// 10. Watch et watchEffect
watch(
  () => props.phrases,
  () => {
    text.value = ''
    phraseIndex.value = 0
    charIndex.value = 0
  },
)

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  if (props.phrases.length) step()
})

onUnmounted(clear)
</script>
