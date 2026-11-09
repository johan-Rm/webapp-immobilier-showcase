# Regroupement de la webapp Nuxt

Préparation du futur cadre AIDE : isoler la racine applicative dans `webapp/`.

Sources, configurations, scripts, tests, fixtures et données locales déplacés ensemble.
Documentation, suivi, CI et infrastructure conservés à la racine, chemins adaptés.
Aucun changement fonctionnel ni installation du cadre AIDE dans cette étape.

Validation : préparation Nuxt, tests unitaires, qualité et résolution Docker Compose.

Résultats : préparation Nuxt et TypeScript OK ; configurations Compose dev, preprod
et prod valides ; 49 tests passent, 2 échouent dans le contrôle préexistant
`verify-types-placement` (collision du nom `relative`, code inchangé).

ESLint, Prettier et build de production Nuxt OK. Contrôle d’intégrité :
aucun fichier versionné déplacé manquant. Contrôle services framework-agnostic OK.
Vérification HTTP du build : route `/fr` servie en SSR, HTTP 200.
