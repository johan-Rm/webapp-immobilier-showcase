# schemas/

Contrats de types et artefacts de schéma partagés entre les couches.

## Rôle et responsabilités

Cette couche centralise les contrats de types et les artefacts de schéma qui structurent
les données applicatives et éditoriales, et sert de contrat stable entre contenu, services,
serveur et frontend. Une partie des artefacts (`interfaces/`, `dtos/`) est générée depuis la
source de vérité des schémas et ignorée par Git : toute évolution passe par la source puis
régénération, jamais par une édition manuelle. Leur absence du suivi de version ne réduit
pas leur importance — ils font partie du contrat réel de l'application.

Le code de cette couche reste framework-agnostic : pas de composant Vue, pas de dépendance
Nuxt ou DOM, pas de logique métier embarquée. Un type qui devient spécifique à une feature
UI est déplacé vers son périmètre local plutôt que d'alourdir ce contrat partagé.

Les sources YAML sont versionnées dans `source/webapp/` et
`source/dtos/symfony_api/`. Le resolver les utilise par défaut ; `SCHEMAS_PATH`
permet une source externe explicite. `bun run setup:local` régénère les contrats.

## Conventions techniques

Aucune règle CI spécifique à ce dossier à ce jour.
