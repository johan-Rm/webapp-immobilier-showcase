/**
 * Adapter client de chargement de contenu via l'API Nitro.
 *
 * La lecture fichier reste strictement côté serveur ; le front consomme
 * uniquement l'endpoint `/api/content/:resource`.
 */
export const loadContentResource = async <T>(resource: ResourceKey, locale: string): Promise<T> => {
  const normalizedLocale = normalizeLocale(locale)

  return $fetch(`/api/content/${resource}` as string, {
    query: { locale: normalizedLocale },
    // Borne l'attente : une requête suspendue ne doit pas bloquer l'init
    // indéfiniment (le boot shell attend la fin de ces chargements).
    timeout: 15_000,
  }) as unknown as T
}
