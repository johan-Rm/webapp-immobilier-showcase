<template>
  <UCard :ui="cardUi">
    <div class="w-full text-center font-bold">
      <div class="w-full">
        <UDrawer
          v-if="props.placeDescription"
          :title="props.city"
          :direction="drawerDirection"
          :ui="{
            overlay: 'bg-black/70 backdrop-blur-sm',
            content:
              'bg-background text-foreground border-border font-body md:my-auto md:h-auto md:max-h-[70vh] md:max-w-md md:min-w-[26rem] md:rounded-l-2xl',
            header: 'font-heading border-b border-border/60 pb-4 mb-4 uppercase',
            title: 'text-heading font-heading text-3xl md:text-4xl leading-tight',
            body: 'font-body pt-2',
          }"
        >
          <UButton
            variant="solid"
            color="neutral"
            class="bg-background pointer-events-auto flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-1 font-semibold uppercase transition-opacity hover:opacity-85"
            :ui="{ base: 'cursor-pointer' }"
            :aria-label="`En savoir plus sur ${props.city}`"
          >
            <UIcon name="i-lucide-map-pin" class="text-md bg-white" aria-hidden="true" />
            <span class="leading-relaxed tracking-wide text-white">
              {{ props.city }}
            </span>
          </UButton>

          <template #body>
            <div class="max-w-prose px-2 pb-4">
              <p class="text-foreground text-base leading-relaxed">
                {{ props.placeDescription }}
              </p>
            </div>
          </template>

          <template #footer>
            <div class="flex items-center justify-start pt-3">
              <span class="text-sm font-medium tracking-wide text-white/40"> Essaouira </span>
            </div>
          </template>
        </UDrawer>

        <div
          v-else
          class="bg-background flex w-full cursor-default items-center justify-center gap-1.5 rounded-lg px-4 py-1 font-semibold uppercase"
        >
          <UIcon name="i-lucide-map-pin" class="text-md bg-white" aria-hidden="true" />
          <span class="leading-relaxed tracking-wide text-white">
            {{ props.city }}
          </span>
        </div>
      </div>

      <HeadingH3
        hide-line
        text-align="center"
        class="mt-2 [--h3-size:clamp(1.8rem,9vw,2.8rem)] md:[--h3-size:clamp(2.4rem,3.5vw,4.6rem)]"
      >
        <NuxtLink
          :to="propertyTo"
          class="cursor-pointer font-black text-white uppercase transition-opacity hover:opacity-85"
          :aria-label="props.ariaLabel"
        >
          {{ props.title }}
        </NuxtLink>
      </HeadingH3>

      <div
        class="text-background/90 mt-3 flex flex-col items-center gap-3 px-4 font-black sm:px-6 md:flex-row md:items-end md:justify-between md:gap-6 2xl:mt-5 2xl:px-10"
      >
        <div
          class="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 uppercase sm:gap-x-5 md:justify-start md:gap-x-6 2xl:gap-x-8"
        >
          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2.5">
            <UIcon name="i-lucide-hash" class="text-sm md:text-lg 2xl:text-xl" aria-hidden="true" />
            <span class="text-base md:text-xl 2xl:text-3xl">
              {{ props.identifier || '—' }}
            </span>
          </p>

          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2.5">
            <UIcon
              name="i-lucide-expand"
              class="text-sm md:text-lg 2xl:text-xl"
              aria-hidden="true"
            />
            <span class="text-base md:text-xl 2xl:text-3xl">
              {{ props.floorSize ? `${props.floorSize} m²` : '—' }}
            </span>
          </p>

          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2.5">
            <UIcon
              name="i-lucide-bed-double"
              class="text-sm md:text-lg 2xl:text-xl"
              aria-hidden="true"
            />
            <span class="text-base md:text-xl 2xl:text-3xl">
              {{ props.numberOfBedrooms ?? '—' }}
            </span>
          </p>
        </div>

        <span
          class="max-w-full text-center text-[clamp(2.2rem,10vw,3rem)] leading-none font-black uppercase md:shrink-0 md:text-right md:text-[clamp(2.4rem,3.5vw,4rem)] 2xl:text-6xl"
        >
          {{ props.price || '—' }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type CardTitlePropertyProps = {
  identifier?: string
  title?: string
  city?: string
  placeDescription?: string | null
  floorSize?: string
  numberOfBedrooms?: number
  price?: string
  href?: string
  ariaLabel: string
  size?: 'hero' | 'compact'
}

// 3. Props et emits
const props = withDefaults(defineProps<CardTitlePropertyProps>(), {
  identifier: '',
  title: '',
  city: '',
  placeDescription: null,
  floorSize: undefined,
  numberOfBedrooms: 1,
  price: '',
  href: '/',
  size: 'compact',
})

// 4. Composables, stores, routeur
const localePath = useLocalePath()

const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const propertyTo = computed(() => localePath('/properties' + props.href))

const isHero = computed(() => props.size === 'hero')

const cardUi = computed(() => ({
  root: isHero.value
    ? 'w-full max-w-4xl 2xl:max-w-6xl rounded-4xl border-0 p-4 bg-transparent shadow-none ring-0'
    : 'w-full max-w-4xl rounded-4xl border-0 p-4 bg-transparent shadow-none ring-0',
  body: isHero.value ? 'p-5 sm:p-6 2xl:px-8' : 'p-4',
}))

// 9. Actions et handlers
const drawerDirection = computed<'right' | 'bottom'>(() => {
  return isPhoneDevice.value || isTabletPortrait.value ? 'bottom' : 'right'
})

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
