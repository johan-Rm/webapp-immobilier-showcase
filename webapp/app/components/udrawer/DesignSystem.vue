<template>
  <USlideover
    v-model:open="sidePanels.designControls.visible"
    side="bottom"
    :ui="{
      content: 'bg-white',
    }"
  >
    <template #content>
      <div class="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 p-5">
        <header class="space-y-2">
          <p class="text-[0.65rem] font-semibold tracking-[0.28em] text-black uppercase">
            Customisation
          </p>
          <h2 class="font-heading text-xl font-semibold text-black">Design &amp; UI</h2>
          <p class="text-foreground text-xs">
            Centralise ici les réglages de thème, ambiance et composants UI.
          </p>
        </header>

        <div
          class="border-border/60 bg-background text-foreground rounded-xl border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
        >
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="p-3">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="space-y-1">
                    <p
                      class="text-foreground text-[0.65rem] font-semibold tracking-[0.25em] uppercase"
                    >
                      Ambiance générale
                    </p>
                    <p class="text-foreground text-xs">
                      Applique l&rsquo;atmosphère globale à tout le site.
                    </p>
                  </div>

                  <div class="border-border bg-surface rounded-xl border p-2.5">
                    <div class="flex items-center justify-between gap-2">
                      <p
                        class="text-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase"
                      >
                        Color Mode
                      </p>
                    </div>
                    <div class="mt-1.5">
                      <ToggleThemeMode :model-value="themeMode" @update:model-value="setTheme" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="space-y-1">
                      <p
                        class="text-foreground text-[0.65rem] font-semibold tracking-[0.25em] uppercase"
                      >
                        Affichage &amp; transitions
                      </p>
                      <p class="text-foreground text-xs">
                        Paramètres spécifiques aux listes de biens immobiliers.
                      </p>
                    </div>
                    <span
                      class="border-border/50 bg-surface/60 text-foreground inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
                    >
                      Immo
                    </span>
                  </div>

                  <div class="grid gap-2 lg:grid-cols-3">
                    <div class="border-border bg-surface rounded-xl border p-2.5">
                      <div class="flex items-center justify-between gap-2">
                        <p
                          class="text-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase"
                        >
                          Vue
                        </p>
                      </div>
                      <div class="mt-1.5">
                        <ToggleViewModeList
                          size="sm"
                          :model-value="viewModeList"
                          @update:model-value="setViewModeList"
                        />
                      </div>
                    </div>

                    <div class="border-border bg-surface rounded-xl border p-2.5">
                      <div class="flex items-center justify-between gap-2">
                        <p
                          class="text-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase"
                        >
                          Transition
                        </p>
                      </div>
                      <div class="mt-1.5">
                        <ToggleTransitionMode
                          size="sm"
                          :model-value="transitionMode"
                          @update:model-value="setTransition"
                        />
                      </div>
                    </div>

                    <div class="border-border bg-surface rounded-xl border p-2.5">
                      <div class="flex items-center justify-between gap-2">
                        <p
                          class="text-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase"
                        >
                          Cinéma
                        </p>
                      </div>
                      <div class="mt-1.5">
                        <ToggleCinemaMode
                          size="sm"
                          :model-value="cinemaMode"
                          @update:model-value="setCinema"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-border/50 bg-surface rounded-lg border p-3">
              <p class="text-foreground text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
                Palette active
              </p>
              <div class="mt-3 grid gap-3 lg:grid-cols-2">
                <div
                  v-for="item in palette"
                  :key="item.name"
                  class="border-border/40 bg-background/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="h-4 w-4 rounded-full shadow-sm"
                      :style="{ backgroundColor: item.value }"
                      aria-hidden="true"
                    />
                    <div class="leading-tight">
                      <p class="text-foreground text-[0.72rem] font-semibold">{{ item.name }}</p>
                      <p class="text-foreground text-[0.64rem]">{{ item.usage }}</p>
                    </div>
                  </div>
                  <code class="text-foreground text-[0.62rem] font-semibold tracking-wide">
                    {{ item.value }}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type PaletteItem = {
  name: string
  value: string
  usage: string
  shade: string
}

type ThemesPayload = {
  themes: Record<
    string,
    {
      colors: Array<{
        label: string
        value?: string
        scale?: Record<string, string>
      }>
    }
  >
}

// 3. Props et emits

// 4. Composables, stores, routeur
const { sidePanels } = useDashboard()

const { viewModeList, setViewModeList } = useAccommodation()

const { themeMode, setTheme, cinemaMode, setCinema } = useDesignSystem()

const colorMode = useColorMode()

const { data: themes } = await useAsyncData('themes-json', () =>
  $fetch<ThemesPayload>('/themes.json'),
)

// 5. Etat local
const paletteKeys = new Map<string, Omit<PaletteItem, 'value'>>([
  ['primary', { name: 'Primary', usage: 'Accent principal', shade: '500' }],
  ['secondary', { name: 'Secondary', usage: 'Accent secondaire', shade: '500' }],
  ['background', { name: 'Background', usage: 'Fond principal', shade: '500' }],
  ['surface', { name: 'Surface', usage: 'Cartes & panneaux', shade: '500' }],
  ['foreground', { name: 'Foreground', usage: 'Texte principal', shade: '500' }],
  ['heading', { name: 'Heading', usage: 'Titres et en-têtes', shade: '500' }],
  ['link', { name: 'Link', usage: 'Liens et états focus', shade: '500' }],
])

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const transitionMode = useState<TransitionMode>('ui.transition.mode', () => 'slide')

const setTransition = (mode: TransitionMode): void => {
  transitionMode.value = mode
}

const paletteByTheme = computed<Record<ThemeMode, PaletteItem[]>>(() => {
  const themesMap = themes.value?.themes ?? {}

  const flattenColors = (
    colors: Array<{ label: string; value?: string; scale?: Record<string, string> }>,
  ): Array<{ label: string; value: string }> =>
    colors.flatMap((color) => {
      const entries: Array<{ label: string; value: string }> = []

      if (color.value) {
        entries.push({ label: color.label, value: color.value })
      }

      if (color.scale) {
        const scaleEntries = Object.entries(color.scale) as Array<[string, string]>
        scaleEntries.forEach(([scaleKey, scaleValue]) => {
          entries.push({ label: `${color.label}-${scaleKey}`, value: scaleValue })
        })
      }

      return entries
    })

  const buildPalette = (key: ThemeMode): PaletteItem[] => {
    const colors = flattenColors(themesMap[key]?.colors ?? [])

    return colors
      .filter((entry) => paletteKeys.has(entry.label))
      .map((entry) => {
        const meta = paletteKeys.get(entry.label)!
        return {
          ...meta,
          value: entry.value,
        }
      })
  }

  return {
    light: buildPalette('light'),
    dark: buildPalette('dark'),
    kasbah: buildPalette('kasbah'),
  }
})

const palette = computed<PaletteItem[]>(() => {
  const byTheme = paletteByTheme.value
  return byTheme[themeMode.value] ?? byTheme[colorMode.preference as ThemeMode] ?? []
})

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
