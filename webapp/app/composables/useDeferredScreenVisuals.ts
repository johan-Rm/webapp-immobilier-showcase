import type { MaybeRefOrGetter, Ref } from 'vue'

type DeferredScreenVisualsStage = 'runtime' | 'passive'

type DeferredScreenVisualsOptions = {
  stage?: DeferredScreenVisualsStage
}

/**
 * Expose un garde réactif pour retarder les visuels non critiques d'un screen.
 *
 * Le chargement est autorisé dès que le palier différé attendu est atteint ou
 * lorsque le screen piloté par `useScreenSystem` devient l'écran actif de la page.
 *
 * @param screenId Identifiant stable du screen concerné.
 * @param enabled Permet de désactiver localement le garde si le screen ne doit
 * pas afficher de visuel dans le contexte courant.
 * @param options Options de priorité du palier différé.
 * @returns Un booléen réactif indiquant si les visuels peuvent être montés.
 *
 * @see ../README.md
 * @see ../../docs/2.architecture/1.application-architecture.md
 * @see ../../docs/2.architecture/4.ssr-safety.md
 */
export const useDeferredScreenVisuals = (
  screenId: string,
  enabled: MaybeRefOrGetter<boolean> = true,
  options: DeferredScreenVisualsOptions = {},
): Ref<boolean> => {
  const { runtimeReady, passiveReady } = useDeferredRuntime()
  const currentScreenId = useState<string | null>('screen.current', () => null)
  const stage = options.stage ?? 'passive'

  return computed<boolean>(() => {
    if (!toValue(enabled)) return false

    const stageReady =
      stage === 'runtime' ? runtimeReady.value || passiveReady.value : passiveReady.value

    return stageReady || currentScreenId.value === screenId
  })
}
