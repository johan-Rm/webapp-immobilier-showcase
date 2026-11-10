/**
 * Expose les jalons runtime différés partagés par le plugin client de l'application.
 *
 * Ce composable ne planifie aucun effet lui-même : il donne uniquement un accès réactif
 * en lecture seule à des états initialisés et pilotés ailleurs dans le runtime Nuxt.
 * Il permet à l'UI de déclencher des comportements non critiques uniquement lorsque
 * le rendu de page, puis les phases différées post-rendu, sont effectivement atteints.
 *
 * Ordre des paliers exposés :
 * 1. `pageFinished` : la navigation Nuxt visible est terminée
 * 2. `runtimeReady` : le palier post-rendu contrôlé est atteint
 * 3. `passiveReady` : le palier passif est atteint après interaction ou fallback
 *
 * @returns Les trois états globaux `pageFinished`, `runtimeReady` et `passiveReady`,
 * exposés en lecture seule pour éviter qu'un consommateur UI ne casse la synchronisation
 * avec le plugin de bootstrap client.
 *
 * @example
 * const { pageFinished, runtimeReady, passiveReady } = useDeferredRuntime()
 *
 * if (pageFinished.value && runtimeReady.value) {
 *   // Déclencher un comportement post-rendu non critique.
 * }
 *
 * @see app/plugins/deferred-runtime.client.ts
 * @see ../README.md
 * @see ../../docs/2.architecture/1.application-architecture.md
 * @see ../../docs/2.architecture/4.ssr-safety.md
 */
export const useDeferredRuntime = () => {
  // Sortie statique : le plugin client qui ouvre ces paliers ne s'executera jamais.
  // Sans cette bascule, tous les visuels differes resteraient absents du livrable.
  const isStaticOutput = useRuntimeConfig().public.staticOutput === true
  // Premier palier : la navigation Nuxt est terminée et la page peut être considérée visible.
  // Il sert de point de départ aux traitements différés enchaînés ensuite par le plugin.
  const pageFinished = useState<boolean>('runtime.page-finished', () => isStaticOutput)

  // Ce palier s'ouvre après la fin de navigation et un délai post-rendu contrôlé.
  // Il sert de garde pour les travaux UI qui ne doivent pas concurrencer le rendu initial.
  const runtimeReady = useState<boolean>('deferred.runtime.ready', () => isStaticOutput)

  // Ce second palier attend une interaction utilisateur ou un fallback temporel.
  // Il reserve les tâches encore moins prioritaires aux phases vraiment passives.
  const passiveReady = useState<boolean>('deferred.passive.ready', () => isStaticOutput)

  return {
    pageFinished: readonly(pageFinished),
    runtimeReady: readonly(runtimeReady),
    passiveReady: readonly(passiveReady),
  }
}
