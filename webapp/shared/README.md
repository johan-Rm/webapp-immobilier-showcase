# Code partagé

## Rôle et responsabilités

- Porter les helpers purs, constantes et contrats communs au client et au serveur.
- Rester indépendant des runtimes et expliquer les contrats de façon **pédagogique et concise**.

## Conventions techniques

### Neutralité des runtimes

Le code partagé ne dépend ni de Vue, de Nitro, du DOM, d’une route ou d’un store. Les éléments propres à un runtime appartiennent à sa couche dédiée.

### Contrats et types

Les types manuels partagés sont distincts des contrats générés et des validations exécutables. Les types inférés sont exportés comme types ; les contrats générés se régénèrent depuis leurs sources, sans modification manuelle.

### Liens éditoriaux

Les liens éditoriaux refusent les protocoles dangereux, chemins réseau, caractères de contrôle et identifiants intégrés aux URL. Leur validation reste pure et testable sans réseau. Une fixture locale ne prouve pas le contrat d’une API externe.
