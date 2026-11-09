<template>
  <div class="bg-background relative flex h-full w-full min-w-0 flex-col pt-0">
    <div ref="scrollContainer" class="min-h-0 flex-1 overflow-y-auto py-4">
      <div class="space-y-6 pb-10 lg:space-y-8">
        <header class="space-y-4 pt-4">
          <div class="space-y-3 px-4">
            <div class="min-w-0 space-y-2">
              <!-- <span class="block h-2 w-12 bg-white/75" aria-hidden="true" /> -->
              <HeadingH1
                color-class="text-foreground"
                class="text-2xl font-semibold text-balance uppercase sm:text-3xl"
              >
                {{ props.property?.name ?? '—' }}
              </HeadingH1>
            </div>

            <div
              class="text-foreground/80 mb-10 flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs font-medium tracking-[0.18em] uppercase"
            >
              <span>{{ props.listingLabel }}</span>
              <span class="bg-foreground/70 h-1 w-1 rounded-full" aria-hidden="true" />
              <span>{{ props.categoryLabel }}</span>
              <span class="bg-foreground/70 h-1 w-1 rounded-full" aria-hidden="true" />
              <span>{{ props.placeLabel }}</span>
            </div>

            <div class="flex justify-start text-left">
              <span class="text-foreground mt-1 text-2xl font-bold sm:text-3xl">
                {{ props.offerLabel }} <span class="ml-1 text-sm font-medium opacity-60">FAI</span>
              </span>
            </div>
          </div>

          <div class="min-w-0">
            <div class="grid h-full w-full grid-cols-1 lg:grid-cols-2">
              <div
                class="bg-foreground text-surface order-2 flex h-11 items-center justify-center px-4 text-center text-sm uppercase sm:h-13 lg:order-1"
              >
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  class="text-surface inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                  aria-label="Aller au formulaire de contact"
                  :disabled="!organizationEmail"
                  :ui="{
                    base: 'rounded-full cursor-pointer ring-0 hover:bg-foreground/10',
                  }"
                  @click="scrollToContactForm"
                >
                  <UIcon name="i-lucide-mail" class="h-5 w-5" aria-hidden="true" />
                </UButton>
              </div>
              <div
                class="bg-surface text-foreground order-1 flex h-11 items-center justify-center px-4 text-center text-sm uppercase sm:h-13 lg:order-2"
              >
                <UButton
                  v-if="firstWhatsAppHref"
                  :href="firstWhatsAppHref"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="neutral"
                  variant="ghost"
                  class="text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                  aria-label="Contacter Showcase Immobilier via WhatsApp"
                  :ui="{
                    base: 'rounded-full cursor-pointer ring-0 hover:bg-surface/10',
                  }"
                >
                  <UIcon name="i-simple-icons-whatsapp" class="h-5 w-5" aria-hidden="true" />
                </UButton>
              </div>
            </div>
          </div>
        </header>

        <section class="space-y-3">
          <h2 class="sr-only">Détails du bien</h2>
          <div class="grid grid-cols-2 gap-3 px-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in orderedSummaryItems" :key="item.key" class="flex flex-col gap-1">
              <div class="text-foreground/70 text-xs uppercase">
                {{ item.label }}
              </div>

              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="text-foreground" />
                <p class="text-foreground font-bold uppercase">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="props.property?.qualities?.length" class="space-y-3 px-4">
          <h2 class="sr-only">Qualités du bien</h2>

          <div class="flex flex-col gap-4">
            <div
              v-for="quality in props.property.qualities"
              :key="String(quality.name)"
              class="flex flex-col gap-1"
            >
              <UProgress :model-value="Number(quality.value)" />

              <span class="text-foreground text-[11px] tracking-[0.2em] uppercase">
                {{ quality.name }}
              </span>
            </div>
          </div>
        </section>

        <section class="space-y-3 px-4">
          <!-- <HeadingH2
            hide-line
            color-class="text-foreground"
            class="text-xs tracking-[0.3em] uppercase"
          >
            {{ props.sections.visitGuide }}
          </HeadingH2> -->
          <div
            v-if="props.property?.body"
            class="markdown-panel text-foreground/80 [&_a]:text-primary [&_blockquote]:border-primary/30 [&_blockquote]:bg-primary/5 [&_blockquote]:text-foreground/80 [&_code]:bg-foreground/10 [&_code]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground/80 [&_pre]:bg-foreground/10 max-w-2xl space-y-4 text-sm leading-relaxed md:text-base [&_a]:underline-offset-4 [&_a]:transition hover:[&_a]:underline [&_blockquote]:rounded-lg [&_blockquote]:border-l-2 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ol>li]:ml-5 [&_ol>li]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-4 [&_ul>li]:ml-5 [&_ul>li]:list-disc"
          >
            <MDC :value="props.property.body" />
          </div>
          <p v-else class="text-foreground/80 text-sm">—</p>
        </section>

        <section class="space-y-3">
          <div class="divide-border/30 divide-y">
            <div
              v-for="item in props.detailItems"
              :key="item.label"
              class="grid grid-cols-1 text-sm sm:grid-cols-[45%_55%]"
            >
              <p class="text-foreground/70 bg-surface/50 px-4 py-3 uppercase">
                {{ item.label }}
              </p>
              <p class="text-foreground bg-surface/25 px-4 py-3 font-semibold uppercase">
                {{ item.value }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="props.featureItems?.length" class="space-y-3 px-4">
          <HeadingH2
            hide-line
            color-class="text-foreground"
            class="text-xs tracking-[0.3em] uppercase"
          >
            {{ props.sections.wellness }}
          </HeadingH2>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="feature in props.featureItems"
              :key="feature.key"
              class="text-foreground inline-flex items-center justify-center gap-1 px-3 py-1.5"
            >
              <UIcon name="i-lucide-circle-check-big" class="text-foreground" />
              {{ feature.label }}
            </span>
          </div>
        </section>

        <section v-if="props.property?.place?.text" class="space-y-3 px-4">
          <HeadingH2
            hide-line
            color-class="text-foreground"
            class="text-xs tracking-[0.3em] uppercase"
          >
            {{ props.sections.location }}
          </HeadingH2>
          <p class="text-foreground/50 mt-2 text-xs 2xl:text-sm">
            {{ props.placeLabel }}
          </p>
          <p class="text-foreground/80 text-sm whitespace-pre-line">
            {{ props.property.place.text }}
          </p>
        </section>

        <section v-if="props.property?.review" class="space-y-3 px-4">
          <HeadingH2
            hide-line
            color-class="text-foreground"
            class="text-xs tracking-[0.3em] uppercase"
          >
            {{ props.sections.review }}
          </HeadingH2>
          <p class="text-foreground/80 text-sm whitespace-pre-line">
            {{ props.property.review }}
          </p>
        </section>

        <section ref="contactSection" class="space-y-3 px-4">
          <HeadingH2
            hide-line
            color-class="text-foreground"
            class="text-xs tracking-[0.3em] uppercase"
          >
            Intéressé ?
          </HeadingH2>
          <FormContactProperty :property-reference="props.property?.identifier ?? ''" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { Accommodation } from '@schemas/interfaces'

import { useTemplateRef } from 'vue'

// 2. Types et constantes statiques
type SummaryItem = {
  key: string
  label: string
  value: string
  icon: string
}

type DetailItem = {
  label: string
  value: string
}

type FeatureItem = {
  key: string
  label: string
}

type SectionLabels = {
  visitGuide: string
  wellness: string
  location: string
  review: string
}

// 3. Props et emits
const props = defineProps<{
  property?: Accommodation
  placeLabel: string
  offerLabel: string
  listingLabel: string
  categoryLabel: string
  summaryItems: SummaryItem[]
  detailItems: DetailItem[]
  featureItems: FeatureItem[]
  sections: SectionLabels
}>()

// 4. Composables, stores, routeur
const appConfig = useAppConfig()

// 5. Etat local

// 6. Data inputs
const scrollContainer = useTemplateRef<HTMLDivElement>('scrollContainer')

const contactSection = useTemplateRef<HTMLElement>('contactSection')

// 7. Validation et helpers purs

// 8. Computed UI-ready
const orderedSummaryItems = computed(() => {
  if (!props.summaryItems?.length) return []

  const referenceItem = props.summaryItems.find(
    (item) =>
      item.key === 'reference' ||
      item.key === 'identifier' ||
      item.label.toLowerCase().includes('référence'),
  )

  const otherItems = props.summaryItems.filter((item) => item !== referenceItem)

  return referenceItem ? [referenceItem, ...otherItems] : props.summaryItems
})

const organizationEmail = computed<string>(() => appConfig.organization.email[0] ?? '')

const organizationPhoneNumbers = computed<string[]>(() => appConfig.organization.phoneNumbers ?? [])

const firstWhatsAppHref = computed<string | undefined>(() => {
  const phone = organizationPhoneNumbers.value.find((phoneNumber) => phoneNumber.trim().length > 0)
  const normalizedPhone = phone?.replace(/\D/g, '')

  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : undefined
})

// 9. Actions et handlers
const resetScrollPosition = (): void => {
  scrollContainer.value?.scrollTo({ top: 0, behavior: 'auto' })
}

const scrollToContactForm = (): void => {
  contactSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

defineExpose<{
  resetScrollPosition: () => void
}>({
  resetScrollPosition,
})

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
