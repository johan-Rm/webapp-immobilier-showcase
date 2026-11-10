<template>
  <div class="overlay-grid">
    <div class="relative">
      <span class="rail left-0"></span>
    </div>

    <div class="relative">
      <div
        class="pointer-events-auto absolute bottom-14 left-1/2 w-full max-w-lg -translate-x-1/2 px-4 sm:bottom-4 xl:max-w-4xl 2xl:bottom-10 2xl:max-w-5xl"
      >
        <div class="flex w-full items-center justify-center gap-3 sm:flex-row xl:gap-5 2xl:gap-6">
          <div class="min-w-0 flex-1 px-0 md:px-8 2xl:px-0">
            <SelectRealEstateListing
              :model-value="value"
              class="w-full text-center"
              :items="items"
              @update:model-value="onUpdateValue"
            />
          </div>

          <div class="min-w-0 flex-1 px-0 md:px-8 2xl:px-0">
            <SelectCategoryPropertyList
              class="w-full text-center"
              :categories="accommodationCategories"
              :active-category-slug="activeCategorySlug"
              @select="onSelectCategory"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="relative">
      <span class="rail right-0"></span>
    </div>

    <UButton
      aria-label="Écran précédent"
      variant="ghost"
      color="neutral"
      :disabled="isPrevDisabled"
      class="group pointer-events-auto absolute top-1/2 left-1 z-30 flex -translate-y-1/2 items-center gap-2 rounded-none border-0 bg-transparent px-2 py-3 text-white/45 opacity-95 shadow-none ring-0 transition-all duration-200 hover:-translate-x-2 hover:-translate-y-1/2 hover:bg-transparent hover:text-white disabled:pointer-events-none disabled:opacity-25 disabled:hover:translate-x-0 disabled:hover:-translate-y-1/2 lg:left-8 lg:gap-3 lg:px-4 lg:py-6"
      :ui="{
        base: 'cursor-pointer rounded-none border-0 bg-transparent shadow-none ring-0 disabled:cursor-not-allowed',
      }"
      @click="$emit('prev')"
    >
      <span
        aria-hidden="true"
        class="block h-12 w-0.5 rounded-full bg-white/50 transition-colors duration-200 group-hover:bg-white lg:h-25"
      />
      <UIcon
        name="i-heroicons-chevron-left"
        class="text-[1.5rem] transition-transform duration-200 group-hover:-translate-x-1 lg:text-[2.5rem]"
      />
    </UButton>

    <UButton
      aria-label="Écran suivant"
      variant="ghost"
      color="neutral"
      :disabled="isNextDisabled"
      class="group pointer-events-auto absolute top-1/2 right-1 z-30 flex -translate-y-1/2 items-center gap-2 rounded-none border-0 bg-transparent px-2 py-3 text-white/45 opacity-95 shadow-none ring-0 transition-all duration-200 hover:translate-x-2 hover:-translate-y-1/2 hover:bg-transparent hover:text-white disabled:pointer-events-none disabled:opacity-25 disabled:hover:translate-x-0 disabled:hover:-translate-y-1/2 lg:right-8 lg:gap-3 lg:px-4 lg:py-6"
      :ui="{
        base: 'cursor-pointer rounded-none border-0 bg-transparent shadow-none ring-0 disabled:cursor-not-allowed',
      }"
      @click="$emit('next')"
    >
      <UIcon
        name="i-heroicons-chevron-right"
        class="text-[1.5rem] transition-transform duration-200 group-hover:translate-x-1 lg:text-[2.5rem]"
      />
      <span
        aria-hidden="true"
        class="block h-12 w-0.5 rounded-full bg-white/50 transition-colors duration-200 group-hover:bg-white lg:h-25"
      />
    </UButton>

    <div class="absolute bottom-2 left-0 z-50 flex w-full justify-center text-center sm:-bottom-1">
      <UButton
        aria-label="Aller au screen suivant"
        variant="ghost"
        color="neutral"
        class="group pointer-events-auto inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border-0 bg-transparent p-3 text-white/88 shadow-none ring-0 transition-transform duration-200 hover:-translate-y-1 hover:bg-transparent hover:text-white"
        :ui="{
          base: 'cursor-pointer rounded-full border-0 bg-transparent shadow-none ring-0',
        }"
        @click="$emit('next-screen')"
      >
        <UIcon
          name="i-heroicons-arrow-down"
          class="text-lg transition-transform duration-200 group-hover:translate-y-1 2xl:text-4xl"
        />
      </UButton>
    </div>

    <div class="absolute bottom-4 left-6 w-full 2xl:bottom-10">
      <ProgressCounter :current="current" :total="total" />
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-80">
      <ProgressBar :progress="progress" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type CategoryItem = {
  slug: string
  name: string
  count: number
  disabled: boolean
}

type RealEstateListingSelectOption = {
  label: string
  value: string
  count: number
  disabled: boolean
}

type Props = {
  value: string
  items: RealEstateListingSelectOption[]
  accommodationCategories: CategoryItem[]
  activeCategorySlug: string | null
  current: number
  total: number
  progress: number
}

// 3. Props et emits
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'select-category', value: string | null): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'next-screen'): void
}>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const isPrevDisabled = computed<boolean>(() => props.current <= 1)

const isNextDisabled = computed<boolean>(() => props.total <= 1 || props.current >= props.total)

// 8. Computed UI-ready

// 9. Actions et handlers
const onUpdateValue = (value: string | number): void => {
  emit('update:value', String(value))
}

const onSelectCategory = (value: string | null): void => {
  emit('select-category', value)
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.overlay-grid {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr min(100%, 56rem) 1fr;
}

@media (min-width: 1536px) {
  .overlay-grid {
    grid-template-columns: 1fr min(100%, 76rem) 1fr;
  }
}

.rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.rail::after {
  content: '';
  position: absolute;
  top: -120%;
  left: 0;
  width: 100%;
  height: 120%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 30%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.4) 70%,
    transparent 100%
  );
  opacity: 0.6;
  animation: lineMove 3.2s linear infinite;
}

@keyframes lineMove {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(300%);
  }
}

@media (max-width: 1024px) {
  .rail::after {
    height: 100%;
  }
}
</style>
