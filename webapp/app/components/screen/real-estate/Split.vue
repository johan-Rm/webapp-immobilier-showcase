<template>
  <!--
    Conteneur principal en deux zones.
    Pleine hauteur et pleine largeur.
  -->
  <div
    class="screen-real-estate-split bg-background text-foreground grid h-full w-full"
    :class="screenColumnTemplate[columnTemplate].value"
  >
    <!--
      Zone visuelle gauche en relatif.
      Pleine hauteur du conteneur.
    -->
    <div class="relative h-full">
      <!--
        Image de fond ancrée sur
        les quatre bords.
        Pleine largeur et hauteur.
      -->
      <AppImage
        v-if="hasBackgroundImage"
        :src="bgImageUrl"
        :alt="bgImageAlt"
        class="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        fetchpriority="low"
        :placeholder="false"
        fit="cover"
      />

      <!--
        Couche intermédiaire superposée
        sur toute la zone visuelle.
      -->
      <AppOverlay :percentage="35" />

      <!--
        Cartouche de localisation ancré
        en bas de la zone visuelle.
      -->
      <div
        v-if="organizationLocation"
        class="absolute right-2 bottom-6 left-6 md:bottom-10 md:left-10"
      >
        <!--
          Conteneur du libellé en largeur
          auto, avec hauteur via padding.
        -->
        <div
          class="text-surface inline-flex items-center gap-3 rounded-2xl px-4 py-2 text-xs font-semibold tracking-[0.2em] backdrop-blur"
        >
          <h5>{{ organizationLocation }}</h5>
        </div>
      </div>
    </div>

    <!--
      Zone de contenu droite en colonne.
      Pleine hauteur, centrée sur l'axe
      vertical.
    -->
    <div
      class="border-border/40 bg-background flex h-full flex-col justify-center px-6 py-4 md:border-l md:px-12 lg:px-16"
    >
      <!--
        Ligne des badges d'identité.
        Retour à la ligne automatique.
      -->
      <div
        class="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase"
      >
        <span v-if="organizationFullName" class="text-primary">{{ organizationFullName }}</span>
        <span v-if="organizationFullName && badgeSecondary" class="text-foreground/40">•</span>
        <span v-if="badgeSecondary" class="text-foreground/70">{{ badgeSecondary }}</span>
      </div>

      <!--
        Bloc titre principal puis accent.
        Aligné dans le flux vertical.
      -->
      <div class="mt-5">
        <h1 class="font-heading text-[clamp(2.3rem,3.6vw,3.9rem)] leading-[1.05]">
          {{ heading }}
        </h1>
        <div v-if="headingAccent" class="mt-2 flex items-center gap-3">
          <span class="bg-surface block h-[2px] w-10" aria-hidden="true" />
          <p class="text-surface mb-1 text-lg font-semibold">{{ headingAccent }}</p>
        </div>
      </div>

      <!--
        Zone de paragraphes d'introduction.
        Espacement vertical constant.
      -->
      <div
        v-if="introParagraphs.length"
        class="text-foreground/80 mt-7 space-y-5 text-base leading-relaxed"
      >
        <p v-for="paragraph in introParagraphs" :key="paragraph">
          {{ paragraph }}
        </p>
      </div>

      <!--
        Grille d'actions en une colonne,
        puis trois colonnes dès md.
      -->
      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <!--
          Lien répété par entrée menu.
          Le lien couvre toute la carte.
        -->
        <NuxtLink
          v-for="item in resolvedMenuItems"
          :key="`${item.url}:${item.name}`"
          :to="localePath(item.url ?? '/')"
          class="group block"
          :aria-label="item.name"
        >
          <!--
            Carte d'action en largeur
            complète du lien parent.
          -->
          <UCard
            variant="outline"
            :ui="{
              root: 'bg-transparent ring-2 ring-foreground divide-y divide-default',
              body: 'relative flex items-center justify-center overflow-hidden text-center',
            }"
          >
            <div class="flex w-full items-center justify-center py-8">
              <h5 class="text-md text-foreground leading-tight font-semibold">
                {{ item.name }}
              </h5>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { MediaObject } from '@schemas/interfaces'

// 2. Types et constantes statiques
/**
 * Props du screen landing en mise en page scindée.
 *
 * La donnée est fournie par le contenu de page enrichi par le mapper :
 * - `image` est déjà résolu en `MediaObject` lorsque la ressource existe
 * - `links` est déjà résolu en `MenuItem[]` prêt à afficher
 *
 * Le composant reste volontairement tolérant aux champs absents afin de
 * préserver le rendu même lorsque le contenu éditorial est partiel.
 */
type SplitScreenProps = {
  data?: CreativeWork
}

// Identifiant technique stable utilisé par la navigation d’écrans.
const SCREEN_ID = 'screen-real-estate-split'
const columnTemplate: ScreenColumnTemplate = 'split-50-50'

// 3. Props et emits
const props = defineProps<SplitScreenProps>()

// 4. Composables, stores, routeur
// Le store applicatif fournit ici l’identité d’organisation utilisée comme
// fallback éditorial et comme repère d’accessibilité pour l’écran.
const appConfig = useAppConfig()
const localePath = useLocalePath()
const { setScreenMeta, screenColumnTemplate } = useScreenSystem()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
/**
 * Découpe un bloc éditorial en paragraphes stables pour le rendu.
 *
 * Le composant attend un texte saisi librement dans le contenu ; cette
 * normalisation évite d’exposer la logique de découpe directement au template.
 *
 * @param text Texte brut potentiellement multi-paragraphes.
 * @returns Liste de paragraphes nettoyés, ou tableau vide si la valeur est inutilisable.
 */
const getParagraphsFromText = (text: string | undefined): string[] => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return []
  }

  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

// 8. Computed UI-ready
// Les informations institutionnelles restent globales à l’application afin
// de ne pas dupliquer ces contenus dans chaque section éditoriale.
const organizationFullName = computed<string | undefined>(() => appConfig.organization.fullName)

const organizationLocation = computed<string | undefined>(() => appConfig.organization.location)

// Le fond visuel est déjà enrichi côté mapper. Ce computed ne conserve que
// les images réellement affichables afin d’éviter un état visuel incohérent.
const backgroundImage = computed<MediaObject | undefined>(() => {
  const image = props.data?.image as MediaObject | string | MediaObject[] | undefined
  if (!image || typeof image === 'string' || Array.isArray(image)) return undefined
  if (!image.url?.trim()) return undefined
  return image
})

// Les dérivés suivants isolent les garde-fous de présentation et évitent de
// propager la logique de fallback dans le template.
const bgImageUrl = computed<string>(() => backgroundImage.value?.url?.trim() ?? '')
const hasBackgroundImage = computed<boolean>(() => bgImageUrl.value.length > 0)

// Le fallback sur le nom d’organisation garantit un texte alternatif exploitable
// même si la légende média n’est pas renseignée côté contenu.
const bgImageAlt = computed<string>(() => {
  const caption = backgroundImage.value?.caption?.trim()
  if (caption) return caption

  return organizationFullName.value?.trim() ?? ''
})

// Les métadonnées éditoriales sont lues directement depuis le bloc courant pour
// conserver un screen autonome et piloté intégralement par le contenu.
const badgeSecondary = computed<string>(
  () => (props.data?.additionalType as string | undefined) ?? '',
)
const heading = computed<string>(() => (props.data?.headline as string | undefined) ?? '')
const headingAccent = computed<string>(
  () => (props.data?.alternativeHeadline as string | undefined) ?? '',
)

// La transformation en paragraphes est isolée ici afin de ne rendre que du
// contenu prêt à afficher, sans logique de parsing dans le template.
const introParagraphs = computed<string[]>(() => {
  const paragraphs = getParagraphsFromText(props.data?.text as string | undefined)
  if (paragraphs.length > 0) {
    return paragraphs
  }

  return []
})

// Les liens d’action sont déjà résolus dans le mapper `webPage`.
// Le composant n’effectue plus de lookup de navigation.
const resolvedMenuItems = computed<MenuItem[]>(() => {
  return (props.data?.links as MenuItem[] | undefined) ?? []
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  // Déclare la configuration de layout après montage pour aligner la navigation
  // par screens avec l’état réellement affiché et les ressources de fond disponibles.
  setScreenMeta(SCREEN_ID, {
    type: 'landing',
    logo: {
      visible: true,
    },
    layout: {
      column: columnTemplate,
      contentZone: 'right',
      imageZone: 'left',
      hasBackgroundImage: hasBackgroundImage.value,
      backgroundImage: bgImageUrl.value,
    },
  })
})
</script>
