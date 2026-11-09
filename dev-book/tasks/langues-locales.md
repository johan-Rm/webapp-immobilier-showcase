# Langues du projet en contenu local

Définir les langues actives et la langue source dans le bloc `i18n` de
`webapp/content/fr/ui/app.yaml`. Le site et le dashboard consomment cette
configuration locale sans dépendre de Symfony pour résoudre les langues.

Conserver la sérialisation SSR et le repli existant si le contenu est invalide.
Valider la lecture YAML réelle, les modifications et les codes de langue.

Validation : 9 tests ciblés passent ; TypeScript et ESLint sur les fichiers
modifiés passent. La configuration ne dépend plus des identifiants Symfony.

## Génération par synchronisation

Le bloc `i18n` est publié par `content-sync.ts` depuis le projet Symfony après
une synchronisation réussie. Préserver les champs éditoriaux et commentaires ;
respecter `--dry-run` et conserver la liste complète même avec `--locale=`.
Tests d’intégration avec API simulée et fichiers temporaires : mise à jour,
dry-run, échec réseau, YAML invalide et création du fichier absent.
