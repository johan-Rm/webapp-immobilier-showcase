<template>
  <section
    class="screen-contact bg-background relative h-dvh min-h-svh w-full overflow-hidden text-white"
  >
    <AppImage
      :src="backgroundImageUrl"
      alt="empty"
      fetchpriority="low"
      :placeholder="false"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover object-center"
      v-bind="IMAGE_PRESETS.fullscreenCover"
    />

    <AppOverlay :percentage="20" />

    <div class="relative z-10 grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <div
        class="flex min-h-0 items-end overflow-y-auto px-5 pt-32 pb-4 sm:px-8 sm:pt-36 md:px-10 md:pb-2 lg:px-20"
      >
        <FormContact
          class="mr-auto w-full max-w-xl rounded-xl bg-black/70 p-5 sm:p-6 md:max-w-2xl md:rounded-2xl md:px-10 md:py-8 lg:ml-[5%]"
        />
      </div>

      <div class="pointer-events-none shrink-0 px-4 pb-4 md:px-8">
        <div class="border-y border-white/55 py-4 md:py-5">
          <p
            class="text-center text-xs leading-relaxed font-medium tracking-[0.16em] text-white/90 uppercase md:text-sm"
          >
            Parlons de votre projet
          </p>
        </div>

        <div
          class="pointer-events-auto mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[0.65rem] leading-relaxed tracking-[0.08em] text-white lg:justify-start lg:text-left"
        >
          <span
            v-for="(contactLink, index) in contactLinks"
            :key="contactLink.to"
            class="inline-flex items-center gap-3"
          >
            <span v-if="index > 0" class="text-white/60 max-lg:hidden" aria-hidden="true"> • </span>

            <ULink :to="contactLink.to" class="text-white transition hover:text-white">
              {{ contactLink.label }}
            </ULink>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type ContactInfoLink = {
  label: string
  to: string
}

const SCREEN_ID = 'screen-contact'
const backgroundImageUrl = '/images/contact-essaouira-port-mouette.jpeg'
const columnTemplate: ScreenColumnTemplate = 'single'

// 3. Props et emits

// 4. Composables, stores, routeur
const appConfig = useAppConfig()
const { setScreenMeta } = useScreenSystem()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const contactEmails = computed(() => appConfig.organization.email)
const contactPhoneEntries = computed(() =>
  getOrganizationPhoneEntries(appConfig.organization.phoneNumbers ?? []),
)

const contactLinks = computed<ContactInfoLink[]>(() => [
  ...contactEmails.value.map((email) => ({
    label: email,
    to: `mailto:${email}`,
  })),
  ...contactPhoneEntries.value.map((phoneEntry) => ({
    label: `${phoneEntry.label} ${phoneEntry.phone}`,
    to: phoneEntry.href,
  })),
])

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  setScreenMeta(SCREEN_ID, {
    type: 'standard',
    logo: {
      visible: true,
    },
    layout: {
      column: columnTemplate,
      contentZone: 'none',
      imageZone: 'background',
      hasBackgroundImage: true,
      backgroundImage: backgroundImageUrl,
    },
  })
})
</script>
