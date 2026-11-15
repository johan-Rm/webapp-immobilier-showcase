# Layouts communs

## Rôle et responsabilités

- Fournir la **structure commune** aux pages qui utilisent le layout.
- Accueillir la **navigation**, les **superpositions** et le **contenu principal**.
- Définir les **dimensions et le défilement du cadre**, indépendamment du contenu métier.

## Conventions techniques

### Contenu de route

Le layout accueille le **contenu de la page dans son slot**, l’emplacement réservé à ce contenu, sans porter sa logique métier.

- Définir explicitement la **hauteur disponible** et l’élément responsable du **défilement**.
- Un Screen gère son défilement interne uniquement lorsque la composition le nécessite.

### Repère principal

Le layout porte l’**unique élément HTML `main`** autour du contenu de la page.

- Vérifier dans le **navigateur** qu’un seul `main` est rendu, y compris avec Nuxt UI, ClientOnly et les superpositions.
- Vérifier que les **marqueurs structurels** atteignent les éléments HTML attendus lorsque le rendu passe par un composant.
- Le contrôle des sources complète cette vérification ; il ne prouve pas le rendu final.
