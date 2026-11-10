<template>
  <div
    v-if="isOpen"
    class="screen-tryptique-menu-v1 bg-background fixed inset-0 z-10000 h-dvh w-screen overflow-hidden"
    :aria-hidden="!isOpen"
  >
    <UButton
      type="button"
      color="neutral"
      variant="ghost"
      class="absolute top-8 right-6 z-10001 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white/80 transition hover:text-white 2xl:top-12 2xl:right-10 2xl:h-20 2xl:w-20 2xl:rounded-[2rem]"
      :ui="{
        base: 'cursor-pointer border-0 bg-transparent p-0 shadow-none ring-0 hover:bg-transparent',
      }"
      :aria-label="closeMenuAriaLabel"
      @click="closeMainMenu"
    >
      <UIcon name="i-lucide-x" class="cursor-pointer text-2xl 2xl:text-[2.8rem]" />
    </UButton>

    <div class="relative grid min-h-svh" :class="screenColumnTemplate[columnTemplate].value">
      <div class="bg-background" :class="contactPanelClass">
        <div
          class="mx-auto flex h-full w-full max-w-6xl flex-col px-6 py-8 sm:py-10 lg:max-w-7xl 2xl:max-w-6xl 2xl:px-14 2xl:py-16"
        >
          <div class="flex flex-1 items-center">
            <div
              class="flex w-full flex-col justify-center gap-10 md:pr-55 lg:pr-65 2xl:gap-16 2xl:pr-88"
            >
              <div class="space-y-2 2xl:space-y-4">
                <div
                  v-if="organizationAcronym"
                  class="text-surface/30 pl-1 text-xs font-bold uppercase 2xl:text-base"
                >
                  {{ organizationAcronym }}
                </div>

                <div
                  v-if="organizationName"
                  class="font-heading text-foreground text-4xl uppercase 2xl:text-7xl"
                >
                  <AppLink
                    v-if="organizationFullName"
                    :to="resolveMenuItemPath('/')"
                    variant="text"
                    class="hover:text-primary transition-colors"
                    @click="handleMenuRouteClick('/')"
                  >
                    {{ organizationName }}
                  </AppLink>

                  <span v-else>{{ organizationName }}</span>
                </div>
              </div>

              <div
                v-if="
                  socialButtonLinks.length || organizationEmail || organizationPhoneEntries.length
                "
                class="flex flex-col gap-8 2xl:gap-14"
              >
                <article class="flex flex-col gap-5 2xl:gap-8">
                  <div class="flex items-center gap-4 2xl:gap-6">
                    <span class="bg-foreground block h-px w-8 2xl:w-14" />
                    <p
                      v-if="stayConnectedTitle"
                      class="font-heading text-foreground text-2xl font-bold 2xl:text-4xl"
                    >
                      {{ stayConnectedTitle }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-3 2xl:gap-6">
                    <AppLink
                      v-for="link in socialButtonLinks"
                      :key="`${link.to}-${link.icon}`"
                      :to="link.to"
                      :aria-label="link.ariaLabel"
                      :target="link.target"
                      :icon="link.icon"
                      icon-class="text-2xl transition duration-200 2xl:text-[2.45rem]"
                    />
                  </div>
                </article>

                <article class="flex flex-col gap-5 2xl:gap-8">
                  <div class="flex items-center gap-4 2xl:gap-6">
                    <span class="bg-foreground block h-px w-8 2xl:w-14" />
                    <p
                      v-if="contactDetailsTitle"
                      class="font-heading text-foreground text-2xl font-bold 2xl:text-4xl"
                    >
                      {{ contactDetailsTitle }}
                    </p>
                  </div>

                  <div class="text-foreground/80 flex flex-col gap-1 text-sm 2xl:gap-3 2xl:text-lg">
                    <AppLink
                      v-if="organizationEmail"
                      :to="`mailto:${organizationEmail}`"
                      :label="organizationEmail"
                      variant="text"
                      text-animation="fill"
                      text-class="from-secondary to-foreground/80 inline-block truncate"
                      class="inline-flex items-center gap-2 transition 2xl:gap-4"
                    />

                    <AppLink
                      v-for="phoneEntry in organizationPhoneEntries"
                      :key="phoneEntry.href"
                      :to="phoneEntry.href"
                      :label="`${phoneEntry.label} ${phoneEntry.phone}`"
                      variant="text"
                      text-class="from-secondary to-foreground/80 inline-block"
                      text-animation="fill"
                      class="inline-flex items-center gap-2 transition 2xl:gap-4"
                    />
                  </div>
                </article>

                <p class="text-foreground/50 mt-2 text-xs 2xl:text-sm">
                  Fermeture hebdomadaire le vendredi, le dimanche et jours fériés
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-foreground" :class="menuPanelClass">
        <div
          class="mx-auto flex h-full w-full max-w-6xl flex-col px-6 py-8 sm:py-10 lg:max-w-7xl 2xl:max-w-[120rem] 2xl:px-14 2xl:py-16"
        >
          <div class="flex flex-1 items-center">
            <div
              class="flex w-full flex-col justify-center gap-8 text-white md:pl-55 lg:gap-10 lg:pl-65 2xl:gap-16 2xl:pl-88"
            >
              <nav :aria-label="mainMenuAriaLabel" class="space-y-5 sm:space-y-6 2xl:space-y-10">
                <ul class="space-y-0">
                  <li v-for="item in primaryMenuItems" :key="item.url">
                    <AppLink
                      v-if="!isDisabledMenuItem(item)"
                      :to="resolveMenuItemPath(item.url)"
                      :aria-current="isActiveMenuPath(item.url) ? 'page' : undefined"
                      variant="text"
                      :class="[
                        primaryMenuLinkClass,
                        isActiveMenuPath(item.url) ? 'text-white after:w-full' : '',
                      ]"
                      @click="handleMenuRouteClick(item.url)"
                    >
                      {{ item.name }}
                    </AppLink>

                    <span
                      v-else
                      :class="[primaryMenuLinkClass, 'cursor-not-allowed text-white/35']"
                      aria-disabled="true"
                    >
                      {{ item.name }}
                    </span>
                  </li>
                </ul>

                <div class="mt-6 flex items-start justify-start gap-12 sm:mt-8 2xl:mt-14">
                  <ul class="space-y-1 text-sm text-white/70 2xl:space-y-3 2xl:text-lg">
                    <li v-for="item in secondaryMenuItems" :key="item.url">
                      <AppLink
                        v-if="!isDisabledMenuItem(item)"
                        :to="resolveMenuItemPath(item.url)"
                        variant="text"
                        text-animation="slide-arrow"
                        class="hover:text-background transition"
                        @click="handleMenuRouteClick(item.url)"
                      >
                        {{ item.name }}
                      </AppLink>

                      <span v-else class="cursor-not-allowed text-white/35" aria-disabled="true">
                        {{ item.name }}
                      </span>
                    </li>
                  </ul>

                  <div class="flex flex-col gap-3 2xl:gap-4">
                    <NavigationLangSwitcher variant="contrast" />

                    <!-- Accès dashboard réservé aux administrateurs connectés. -->
                    <AppLink
                      v-if="loggedIn"
                      :to="localePath('/dashboard')"
                      icon="i-lucide-layout-dashboard"
                      label="Tableau de bord"
                      variant="text"
                      class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/50 uppercase transition hover:text-white 2xl:text-sm"
                      @click="handleMenuRouteClick('/dashboard')"
                    />
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute top-1/2 left-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
      <NuxtLink
        :to="resolveMenuItemPath('/')"
        :aria-label="homeLinkAriaLabel"
        class="group focus-visible:ring-primary relative block w-50 rounded-3xl focus-visible:ring-2 focus-visible:outline-none sm:w-55 lg:w-67.5 2xl:w-92"
        prefetch-on="visibility"
        @click="handleMenuRouteClick('/')"
      >
        <div class="bg-foreground/20 absolute -inset-4 rounded-xl blur-2xl" />
        <div class="bg-surface/40 overflow-hidden rounded-3xl">
          <AppImage
            :src="centerImageUrl"
            alt=""
            class="h-90 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-105 lg:h-115 2xl:h-150"
            loading="lazy"
            decoding="async"
            v-bind="IMAGE_PRESETS.galleryColumn"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type TryptiqueMenuItem = MenuItem

type SocialLink = AppFooterSocialLink

type SocialButtonLink = {
  to: string
  icon: string
  ariaLabel: string
  target?: AppLinkTarget
}

const primaryMenuLinkClass =
  'group relative inline-flex text-left text-xl text-white/90 transition duration-200 hover:text-white after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-white/90 after:transition-all after:duration-200 hover:after:w-full sm:text-2xl 2xl:text-[2.8rem] 2xl:leading-[1.16]'

const columnTemplate: ScreenColumnTemplate = 'split-50-50'

// 3. Props et emits

// 4. Composables, stores, routeur
const { footer } = useAppFooter()

const appConfig = useAppConfig()

const localePath = useLocalePath()

const { loggedIn } = useUserSession()

const route = useRoute()

const { appData, primaryMenuItems, secondaryMenuItems } = useAppNavigation()

const { getItemsByRealEstateListing } = useAccommodation()

const { isPhoneDevice } = useDeviceDetect()

const { sidePanels, closeSidePanel } = useDashboard()

const { warmQuickActionTarget } = useQuickActionWarmup()

const { setScreenMeta, screenColumnTemplate } = useScreenSystem()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const getListingSlugFromUrl = (url?: string): string => {
  if (!url) return ''
  return url.split('/').filter(Boolean).at(-1) ?? ''
}

const isListingUrl = (url?: string): boolean => {
  return typeof url === 'string' && url.includes('/properties/')
}

const isDisabledMenuItem = (item: MenuItem): boolean => {
  if (!isListingUrl(item.url)) return false

  const listingSlug = getListingSlugFromUrl(item.url)
  const count = getItemsByRealEstateListing(listingSlug).value.length

  return count === 0
}

const isOpen = computed<boolean>(() => sidePanels.value.mainMenu.visible)

const resolveMenuItemPath = (url?: string): string => localePath(url ?? '/')

const isActiveMenuPath = (url?: string): boolean => route.path === resolveMenuItemPath(url)

// 8. Computed UI-ready
const organization = computed(() => appConfig.organization)

const organizationPhoneEntries = computed(() =>
  getOrganizationPhoneEntries(organizationPhoneNumbers.value ?? []),
)

const navigationMainContent = computed(() => appData.value?.components?.navigationMain)

// 9. Actions et handlers
const contactMenuItem = computed<TryptiqueMenuItem | undefined>(() =>
  secondaryMenuItems.value?.find((item) => item.url === '/contact'),
)

const homeMenuItem = computed<TryptiqueMenuItem | undefined>(() =>
  primaryMenuItems.value?.find((item) => item.url === '/'),
)

const organizationAcronym = computed<string | undefined>(() => organization.value?.acronym)

const organizationFullName = computed<string | undefined>(() => organization.value?.fullName)

const organizationName = computed<string | undefined>(() => organization.value?.alternateName)

const organizationEmail = computed<string | undefined>(() => organization.value?.email[0])

const organizationPhoneNumbers = computed<string[] | undefined>(
  () => organization.value?.phoneNumbers,
)

const closeMenuAriaLabel = computed<string | undefined>(
  () => navigationMainContent.value?.closeMenuAriaLabel,
)

const stayConnectedTitle = computed<string | undefined>(
  () => navigationMainContent.value?.stayConnectedTitle,
)

const contactDetailsTitle = computed<string | undefined>(
  () => navigationMainContent.value?.contactDetailsTitle,
)

const homeLinkAriaLabel = computed<string | undefined>(
  () =>
    homeMenuItem.value?.name ??
    organizationFullName.value ??
    organizationName.value ??
    organizationAcronym.value,
)

const mainMenuAriaLabel = computed<string | undefined>(
  () => navigationMainContent.value?.mainMenuAriaLabel,
)

const socialLinks = computed<SocialLink[]>(() => footer.value?.socialLinks ?? [])

const socialButtonLinks = computed<SocialButtonLink[]>(() => {
  const links: SocialButtonLink[] = socialLinks.value.map((social) => ({
    to: social.to,
    icon: social.icon,
    ariaLabel: social['aria-label'],
    target: social.target,
  }))

  if (contactMenuItem.value) {
    links.push({
      to: localePath(contactMenuItem.value.url ?? '/'),
      icon: 'i-lucide-mail',
      ariaLabel: 'Contact',
    })
  }

  return links
})

const centerImageUrl = computed<string>(() => appConfig.menu.mainMenuCenterImageUrl)

const contactPanelClass = computed<string>(() => (isPhoneDevice.value ? 'order-2' : 'order-1'))

const menuPanelClass = computed<string>(() => (isPhoneDevice.value ? 'order-1' : 'order-2'))

const closeMainMenu = (): void => closeSidePanel('mainMenu')

const handleMenuRouteClick = (url?: string): void => {
  if (!isActiveMenuPath(url)) return

  closeMainMenu()
}

const warmMenuItems = (): void => {
  const items = [...primaryMenuItems.value, ...secondaryMenuItems.value]

  items
    .filter((item) => !isDisabledMenuItem(item))
    .forEach((item) => {
      if (!item.url) return

      warmQuickActionTarget({
        id: `main-menu-${item.url}`,
        to: resolveMenuItemPath(item.url),
      })
    })
}

// 10. Watch et watchEffect
watch(isOpen, (open) => {
  if (!open) return

  warmMenuItems()
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  setScreenMeta('screen-tryptique-menu-v1', {
    type: 'standard',
    layout: {
      column: columnTemplate,
      contentZone: 'multiple',
      imageZone: 'center',
    },
  })
})
</script>
