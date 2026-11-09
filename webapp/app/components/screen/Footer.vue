<template>
  <!--
    Conteneur principal en deux zones.
    Pleine hauteur, découpe mobile 65/35
    puis une ligne dès md.
  -->
  <footer class="screen-footer bg-background text-foreground" :class="rootGridClass">
    <!--
        Zone de contenu à gauche.
        Structure en colonne, sur toute
        la hauteur disponible.
      -->
    <div :class="contentColumnClass">
      <!--
        Conteneur vertical principal.
        Il répartit le contenu principal
        et le pied en bas.
      -->
      <div class="flex min-h-0 flex-1 flex-col md:h-full">
        <!--
          Bloc supérieur extensible.
          Il regroupe les lignes
          principales du footer.
        -->
        <div class="flex min-h-0 flex-1 flex-col">
          <!--
              Première ligne en grille.
              Une colonne sur mobile,
              deux colonnes en grand écran.
            -->
          <div
            v-if="socialButtonLinks.length || contactEntries.length"
            class="grid flex-1 grid-cols-1 content-center gap-6 md:grid-cols-2"
          >
            <!--
                Colonne des liens sociaux
                et du contact direct.
              -->
            <div class="flex flex-col items-center gap-8 text-center">
              <LazyHeadingH2
                v-if="stayConnectedTitle && !isPhoneDevice"
                hide-line
                size="2xl"
                color-class="primary"
                text-align="center"
                class="uppercase"
              >
                {{ stayConnectedTitle }}
              </LazyHeadingH2>
              <nav
                aria-label="Réseaux sociaux et contact"
                class="flex flex-wrap items-center gap-2"
              >
                <LazyAppLink
                  v-for="link in socialButtonLinks"
                  :key="`${link.to}-${link.icon}`"
                  :to="link.to"
                  :aria-label="link.ariaLabel"
                  :target="link.target"
                  :icon="link.icon"
                  icon-class="text-2xl transition duration-200"
                />
              </nav>
            </div>

            <!--
                Colonne des coordonnées.
                Liste verticale des moyens
                de contact.
              -->
            <div class="flex flex-col items-center gap-8 text-center">
              <LazyHeadingH2
                v-if="contactDetailsTitle && !isPhoneDevice"
                hide-line
                size="2xl"
                color-class="primary"
                text-align="center"
                class="uppercase"
              >
                {{ contactDetailsTitle }}
              </LazyHeadingH2>

              <!--
                  Bloc d'adresse structuré
                  en liste compacte.
                -->
              <nav :aria-label="contactDetailsTitle">
                <ul class="text-foreground flex flex-col gap-1 text-left">
                  <li
                    v-for="entry in contactEntries"
                    :key="entry.href"
                    class="flex min-h-0 items-center text-sm hover:text-white"
                  >
                    <AppLink
                      :to="entry.href"
                      :label="entry.label"
                      variant="text"
                      text-animation="fill"
                      :text-class="LINK_FILL_TEXT_CLASS"
                      class="inline-flex items-center justify-center gap-2 transition"
                    />
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <!--
              Deuxième ligne en grille.
              Une colonne sur mobile,
              trois colonnes en grand écran.
            -->
          <div v-if="!isPhoneDevice" class="grid flex-1 grid-cols-2 content-center gap-6">
            <!--
                Section des types de biens.
                Masquée sur petit écran,
                étendue sur deux colonnes.
              -->
            <div class="flex flex-col items-center gap-8 text-center">
              <LazyHeadingH2
                hide-line
                size="2xl"
                color-class="primary"
                text-align="center"
                class="uppercase"
              >
                {{ accommodationLabel }}
              </LazyHeadingH2>

              <nav
                :aria-label="accommodationLabel"
                class="text-foreground grid grid-cols-2 gap-1 text-sm"
              >
                <LazyAppLink
                  v-for="link in accommodationLinks"
                  :key="`${link.to}:${link.label}`"
                  :disabled="true"
                  :to="localePath(link.to)"
                  :label="link.label"
                  variant="text"
                  text-animation="slide-arrow"
                  :text-class="LINK_FILL_TEXT_CLASS"
                  class="text-foreground/70 inline-flex items-center !opacity-100 !grayscale-0 transition hover:text-white/90"
                />
              </nav>
            </div>

            <!--
                Section des services.
                Affichée sur toute la
                largeur de sa colonne.
              -->
            <div class="flex flex-col items-center gap-8 text-center">
              <LazyHeadingH2
                hide-line
                size="2xl"
                color-class="primary"
                text-align="center"
                class="uppercase"
              >
                {{ servicesLabel }}
              </LazyHeadingH2>

              <nav :aria-label="servicesLabel" class="text-foreground flex flex-col gap-1 text-sm">
                <LazyAppLink
                  v-for="link in servicesLinks"
                  :key="`${link.to}:${link.label}`"
                  :to="localePath(link.to)"
                  :label="link.label"
                  variant="text"
                  text-animation="slide-arrow"
                  :text-class="LINK_FILL_TEXT_CLASS"
                  class="text-foreground/70 inline-flex items-center transition hover:text-white/90"
                />
              </nav>
            </div>
          </div>
        </div>

        <!--
            Bande de pied avec séparation
            en haut et contenu en une
            puis deux colonnes.
          -->
        <div class="text-foreground flex flex-wrap items-center gap-3 text-xs">
          <LazyUSeparator class="mx-auto w-full" color="primary" />

          <div
            class="grid w-full grid-cols-1 items-center gap-4 px-4 pb-4 text-center sm:grid-cols-2 sm:text-left"
          >
            <!--
                Colonne gauche des crédits.
                Éléments en ligne avec
                retour automatique.
              -->
            <div
              v-if="hasCreditsLine"
              class="text-foreground flex flex-wrap items-center justify-center gap-3 sm:justify-start"
            >
              <template v-for="(part, index) in creditsParts" :key="`${part}-${index}`">
                <span v-if="index > 0" class="hidden sm:inline">•</span>
                <span>{{ part }}</span>
              </template>
            </div>

            <!--
                Colonne droite des liens
                méta, centrée puis alignée
                à droite dès sm.
              -->
            <div
              v-if="metaLinks.length"
              class="flex flex-wrap items-center justify-center gap-3 sm:justify-end"
              :aria-label="metaLabel"
            >
              <template v-for="(link, index) in metaLinks" :key="`${link.to}:${link.label}`">
                <span v-if="index > 0">|</span>
                <LazyAppLink
                  :to="localePath(link.to)"
                  :label="link.label"
                  variant="text"
                  :text-class="LINK_FILL_TEXT_CLASS"
                  class="transition"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--
      Zone image à droite, en relatif.
      Pleine hauteur avec média ancré
      sur toute la surface.
    -->
    <div :class="visualColumnClass">
      <LazyAppImage
        v-if="shouldLoadVisuals"
        :src="backgroundImage.url"
        :alt="backgroundImage.alt"
        :width="BACKGROUND_IMAGE_WIDTH"
        class="absolute inset-0 h-full w-full object-cover object-center"
        fetchpriority="low"
        :placeholder="false"
        fit="cover"
      />
      <!--
        Couche intermédiaire superposée
        sur toute la zone image.
      -->
      <LazyAppOverlay :percentage="40" />
    </div>
  </footer>
</template>

<script setup lang="ts">
// 1. Imports
import type { MediaObject } from '@schemas/interfaces'

// 2. Types et constantes statiques
type FooterLink = AppFooterLink
type FooterSocialLink = AppFooterSocialLink

type SocialButtonLink = {
  to: string
  icon: string
  ariaLabel: string
  target?: AppLinkTarget
}

type FooterScreenProps = {
  data?: CreativeWork
}

type RawImageObject = {
  url?: string
  alt?: string
  caption?: string
}

type ContactEntry = {
  label: string
  href: string
  icon: string
}

const SCREEN_ID = 'screen-footer'
const COLUMN_TEMPLATE: ScreenColumnTemplate = 'split-67-33'
const DEFAULT_BACKGROUND_IMAGE_URL = '/demo/coast.svg'
const DEFAULT_BACKGROUND_IMAGE_ALT = 'Showcase Immobilier'
const LINK_FILL_TEXT_CLASS = 'from-secondary to-foreground/70 inline-block'

// 3. Props et emits
const props = defineProps<FooterScreenProps>()

// 4. Composables, stores, routeur
const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()

const logger = useLogger({ module: 'screen-footer' })

const { footer } = useAppFooter()
const { appData, getMenuItemByIdentifier } = useAppNavigation()
const { setScreenMeta } = useScreenSystem()
const { IMAGE_DIMENSIONS } = useAppImage()

const appConfig = useAppConfig()
const localePath = useLocalePath()
const BACKGROUND_IMAGE_WIDTH = IMAGE_DIMENSIONS.vertical3col.width

// 5. Etat local

// 6. Data inputs
const footerContent = computed(() => footer.value)
const navigationMainContent = computed(() => appData.value?.components?.navigationMain)
const footerMenus = computed(() => appConfig.menu ?? {})

// 7. Validation et helpers purs
const getImageAlt = (image: MediaObject | RawImageObject): string | undefined => {
  if ('alt' in image && typeof image.alt === 'string' && image.alt.trim().length > 0) {
    return image.alt
  }

  if (typeof image.caption === 'string' && image.caption.trim().length > 0) {
    return image.caption
  }

  return undefined
}

const resolveBackgroundImage = (image?: CreativeWork['image']): { url: string; alt: string } => {
  if (typeof image === 'string' && image.trim().length > 0) {
    return {
      url: image,
      alt: DEFAULT_BACKGROUND_IMAGE_ALT,
    }
  }

  if (image && typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
    const rawImage = image as MediaObject | RawImageObject
    const url = image.url.trim()

    if (url.length > 0) {
      const alt = getImageAlt(rawImage) ?? DEFAULT_BACKGROUND_IMAGE_ALT

      return {
        url,
        alt,
      }
    }
  }

  return {
    url: DEFAULT_BACKGROUND_IMAGE_URL,
    alt: DEFAULT_BACKGROUND_IMAGE_ALT,
  }
}

const resolveMenuLinks = (menuName?: string): FooterLink[] => {
  if (!menuName) {
    return []
  }

  const raw = footerMenus.value?.[menuName as keyof typeof footerMenus.value] ?? []
  const identifiers: string[] = Array.isArray(raw) ? raw : [raw]

  return identifiers
    .map((identifier) => getMenuItemByIdentifier(identifier))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => ({
      label: item.name ?? '',
      to: item.url ?? '/',
    }))
}

// 8. Computed UI-ready
const contactPageLink = computed(() => localePath('/contact'))
const organizationEmail = computed<string>(() => appConfig.organization.email[0] ?? '')
const organizationPhoneNumbers = computed<string[]>(() => appConfig.organization.phoneNumbers ?? [])

const stayConnectedTitle = computed<string>(
  () => navigationMainContent.value?.stayConnectedTitle ?? '',
)

const contactDetailsTitle = computed<string>(
  () => navigationMainContent.value?.contactDetailsTitle ?? '',
)

const accommodationMenuName = computed<string | undefined>(
  () => footerContent.value?.accommodationTypes?.menu,
)

const servicesMenuName = computed<string | undefined>(() => footerContent.value?.services?.menu)

const metaMenuName = computed<string | undefined>(() => footerContent.value?.meta?.menu)

const backgroundImage = computed<{ url: string; alt: string }>(() =>
  resolveBackgroundImage(props.data?.image),
)

const socialLinks = computed<FooterSocialLink[]>(() => footerContent.value?.socialLinks ?? [])

const socialButtonLinks = computed<SocialButtonLink[]>(() => [
  ...socialLinks.value.map((social) => ({
    to: social.to,
    icon: social.icon,
    ariaLabel: social['aria-label'],
    target: social.target,
  })),
  {
    to: contactPageLink.value,
    icon: 'i-lucide-mail',
    ariaLabel: 'Contact',
  },
])

const contactEntries = computed<ContactEntry[]>(() => {
  const entries: ContactEntry[] = []

  if (organizationEmail.value) {
    entries.push({
      label: organizationEmail.value,
      href: `mailto:${organizationEmail.value}`,
      icon: 'i-lucide-mail',
    })
  }

  entries.push(
    ...getOrganizationPhoneEntries(organizationPhoneNumbers.value).map((phoneEntry) => ({
      label: `${phoneEntry.label} ${phoneEntry.phone}`,
      href: phoneEntry.href,
      icon: 'i-lucide-phone',
    })),
  )

  return entries
})

const accommodationLabel = computed<string>(
  () => footerContent.value?.accommodationTypes?.label ?? 'Nos biens immobiliers',
)

const accommodationLinks = computed<FooterLink[]>(() =>
  resolveMenuLinks(accommodationMenuName.value),
)

const servicesLabel = computed<string>(() => footerContent.value?.services?.label ?? 'Services')

const servicesLinks = computed<FooterLink[]>(() => resolveMenuLinks(servicesMenuName.value))

const metaLabel = computed<string>(() => footerContent.value?.meta?.label ?? 'Informations')

const metaLinks = computed<FooterLink[]>(() => resolveMenuLinks(metaMenuName.value))

const credits = computed<string>(() => footerContent.value?.credits ?? '')
const creditsParts = computed<string[]>(() => [credits.value.trim()].filter(Boolean))
const hasCreditsLine = computed<boolean>(() => creditsParts.value.length > 0)

const rootGridClass = computed<string>(() => {
  const baseClass = 'grid min-h-0'

  if (isTabletPortrait.value) return `${baseClass} h-screen grid-cols-1 grid-rows-[40%_1fr]`
  if (!isPhoneDevice.value) return `${baseClass} h-full grid-cols-[66.67%_33.33%] grid-rows-1`
  return `${baseClass} h-screen grid-cols-1 grid-rows-[50%_1fr]`
})

const contentColumnClass = computed<string>(() => {
  const baseClass = 'relative flex h-full min-h-0 flex-col'
  return isTabletPortrait.value || isPhoneDevice.value
    ? `${baseClass} row-start-2`
    : `${baseClass} row-start-1`
})

const visualColumnClass = computed<string>(() => {
  const baseClass = 'relative h-full min-h-0 min-w-0 overflow-hidden'
  return isTabletPortrait.value || isPhoneDevice.value ? `${baseClass} row-start-1` : baseClass
})
const shouldLoadVisuals = useDeferredScreenVisuals(
  SCREEN_ID,
  computed(() => backgroundImage.value.url.trim().length > 0),
)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  logger.info('Mounted screen', {
    screenId: SCREEN_ID,
    socialLinksCount: socialLinks.value.length,
    contactEntriesCount: contactEntries.value.length,
  })

  setScreenMeta(SCREEN_ID, {
    type: 'footer',
    logo: {
      visible: false,
    },
    socialNetwork: {
      visible: false,
    },
    layout: {
      column: COLUMN_TEMPLATE,
      contentZone: 'left',
      imageZone: 'right',
    },
  })
})

onUnmounted(() => {
  logger.info('Unmounted screen', {
    screenId: SCREEN_ID,
  })
})
</script>
