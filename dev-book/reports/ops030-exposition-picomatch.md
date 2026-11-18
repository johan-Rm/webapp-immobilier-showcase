# Exposition à Picomatch — analyse du 18 novembre 2026

Demande de consolidation : DEM-011. Carte : OPS-030. Analyse technique, aucun arbitrage humain ni exception appliquée.

## Conclusion

Aucun chemin identifié ne transmet un motif provenant d’une requête HTTP à Picomatch dans le code applicatif examiné. Les appels retrouvés servent à sélectionner les fichiers de compilation, de tests ou d’analyse. Les trois builds SSR locaux examinés ne contiennent ni paquet Picomatch ni marqueur de son code exécutable. Ces observations permettent de proposer une acceptation temporaire du risque pour cet avis précis, sous les limites ci-dessous ; elles ne corrigent pas la dépendance.

## Références et périmètre

- Sources locales à la révision `f94b0aaf8fec7fa54df50a0527001a8a32aa7b08` et dépendances des lockfiles corrigés ; inventaires et empreintes dans le bilan OPS-031.
- Image locale des contrôles : `sha256:23982a1168282484421f95ba90b8cafe1637be37276a8dd52d60590636f97dc4`.
- [Avis officiel GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), vérifié le 18 novembre : motifs extglob répétés spécialement construits, versions jusqu’à 4.0.7 affectées, aucune version corrigée répertoriée.
- Scénario étudié : une donnée non maîtrisée devient le **motif compilé** par Picomatch. Une donnée comparée à un motif interne fixe n’établit pas à elle seule ce scénario.
- Recherche des imports et appels dans l’application, les services, les vérificateurs et les dépendances directes de Picomatch ; lecture des configurations Nuxt, Vitest et dependency-cruiser.

## Origine des motifs observés

| Usage | Source des motifs | Observation |
| --- | --- | --- |
| Vite, Vitest, tinyglobby | Configurations et sélection des fichiers du dépôt | Outils de développement et tests ; aucun endpoint applicatif identifié |
| Nuxt et auto-imports | Dossiers de pages, composants et imports déclarés dans les couches | Recherche de fichiers pendant la préparation et la compilation |
| Vue Router | Extension de génération de routes dans `dist/unplugin-*.mjs` | Import Picomatch retrouvé dans l’extension de compilation |
| Nuxt Icon | `IconUsageScanner.globInclude` et `globExclude` | `pm.isMatch(path, globInclude)` filtre les fichiers sources ; les motifs viennent des options du scanner |
| dependency-cruiser | Chemins et motifs des arguments CLI, configuration et workspaces | Analyse locale des sources ; exécution via les commandes du dépôt |

L’application ne possède aucun import direct de Picomatch, Micromatch ou Tinyglobby retrouvé dans les sources examinées. Le scanner Nuxt Icon utilise les options locales ou ses valeurs par défaut. Le Dashboard fixe `app/**/*.vue` dans sa configuration. Le handler HTTP des icônes traite des noms de collections et d’icônes via `getIcons`, et ne transmet pas ces valeurs au scanner de fichiers. Les configurations Vitest définissent leurs inclusions dans le dépôt.

Références de lecture : `webapp/node_modules/@nuxt/icon/dist/shared/icon.sP0tVXUq.mjs` (scanner), `webapp/node_modules/@nuxt/icon/dist/runtime/server/api.js` (handler), `webapp/node_modules/nuxt/dist/index.mjs` (pages), `webapp/node_modules/unimport/dist/shared/unimport.MsUjDeF6.mjs` (imports), `webapp/node_modules/dependency-cruiser/src/extract/gather-initial-sources.mjs` (motifs CLI), et configurations suivies correspondantes. Ces chemins de dépendances sont ceux de la révision analysée.

## Livrables SSR examinés

Trois préparations et builds Nuxt indépendants sont exécutés dans des conteneurs jetables avec le profil de test et les données simulées, sans serveur utilisateur ni environnement privé. Chaque arbre serveur est parcouru récursivement, y compris ses liens internes, en recensant les manifestes et en recherchant `picomatch`, `analyzeRepeatedExtglob` et `REGEX_SPECIAL_CHARS_BACKREF` dans les fichiers JavaScript et JSON. Les cartes de sources sont exclues du code exécutable. Aucun lien externe à l’arbre serveur n’est rencontré.

| Cible | Fichiers serveur parcourus | Manifestes | Paquet Picomatch | Marqueurs dans le JavaScript |
| --- | ---: | ---: | --- | --- |
| showcase-immobilier | 2508 | 292 | Absent | Aucun retrouvé |
| client2-immobilier | 290 | 45 | Absent | Aucun retrouvé |
| dashboard | 354 | 57 | Absent | Aucun retrouvé |

La seule occurrence textuelle retrouvée est une déclaration de dépendance dans `node_modules/vue-router/package.json`. Aucun fichier d’implémentation Picomatch n’est présent dans les trois arbres. Le stage d’exécution du Dockerfile SSR copie la sortie `.output` et ne copie pas le `node_modules` complet de compilation.

Journaux et inventaires : `webapp/.tmp/quality/picomatch-exposure/build-<cible>.log` et `<cible>.json`. Les trois constructions terminent avec le code 0 ; les conteneurs sont supprimés automatiquement à leur sortie.

## Risque résiduel et limites

- La dépendance vulnérable reste installée dans les environnements de développement et de contrôle, et son audit reste bloquant.
- L’exécution de motifs non maîtrisés introduits par une configuration, un argument CLI, une dépendance ou une évolution applicative reste un scénario à traiter.
- Les preuves portent sur les sources et builds SSR locaux examinés, avec le profil de test. Aucune image déjà déployée ni machine de production n’est inspectée.
- La recherche de références et de marqueurs apporte des indices techniques concordants, pas une preuve formelle de toutes les résolutions dynamiques possibles. Aucun test d’intrusion ni reproduction offensive de la faille n’est exécuté.
- Tout changement de dépendances, d’imports, de configuration ou de mode de livraison impose une nouvelle appréciation avant de conserver une éventuelle exception.

## Proposition à arbitrer

Proposition uniquement : exception du seul couple paquet/avis ci-dessous jusqu’au **2 décembre 2026**, pour les deux inventaires audités. Elle accepte temporairement le risque contextualisé ; elle ne déclare pas la bibliothèque corrigée. Les autres avis conservent leurs seuils. L’exception serait retirée dès disponibilité et validation d’un correctif, ou à la découverte d’un chemin exposé. La réévaluation lors d’un changement reste une exigence de revue ; aucun garde-fou automatique d’inventaire SSR n’est ajouté par cette analyse.

```json
{
  "package": "picomatch",
  "advisory": "GHSA-fc5q-39xc-vjpf",
  "reason": "Analyse OPS-030 du 2026-11-18 : motifs observés issus des configurations de compilation et de contrôle ; aucun chemin HTTP identifié vers le motif Picomatch et aucun code Picomatch retrouvé dans les trois livrables SSR locaux examinés. Réexaminer à tout changement de dépendances, configuration ou livraison ; retirer dès correctif disponible et validé.",
  "expires": "2026-12-02"
}
```

Cette proposition n’est pas ajoutée à `webapp/scripts/quality/security-exceptions.json`. L’audit demeure bloquant en attente d’un éventuel arbitrage explicite.
