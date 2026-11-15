# Sites immobiliers

## Rôle et responsabilités

- Isoler l’identité, les contenus, médias, thèmes et surcharges de chaque client.
- Fournir une application Nuxt par site avec des responsabilités **claires et concises**.

## Conventions techniques

### Isolation des clients

Chaque client utilise sa propre layer et son application. Le catalogue immobilier est étendu explicitement ; une cible ne charge pas implicitement les pages ou initialisations d’une autre cible.

### Contenus et démonstrations

Les contenus éditoriaux respectent leurs contrats de schéma ; le parsing et les enrichissements appartiennent aux services. Les données de démonstration sont **fictives et explicitement marquées**. Leur préparation conserve les localisations et refuse de remplacer une donnée utilisateur ou un référentiel non fictif. Les médias de démonstration sont conservés et leurs droits restent vérifiables.
