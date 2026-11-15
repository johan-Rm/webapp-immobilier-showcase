# Serveur BFF

## Rôle et responsabilités

- Exposer les routes et traitements Nitro consommés par le frontend.
- Valider les entrées, orchestrer les backends et normaliser les réponses.
- Conserver les secrets et accès privilégiés côté serveur.
- Présenter des erreurs **pédagogiques et concises**.

## Conventions techniques

### Frontière de confiance

Le BFF contrôle les autorisations sur chaque opération ; une autorisation affichée dans le navigateur ne remplace pas celle du serveur. Les jetons et identifiants privilégiés ne sont jamais exposés au client.

### Erreurs et destinations

Les refus métier restent distincts des pannes techniques. Les destinations et redirections des appels amont sont contrôlées, sans suivre implicitement une origine étrangère.

### Vérifications isolées

Les tests unitaires utilisant Bun sont séparés des intégrations HTTP H3 utilisant Vitest. Les intégrations emploient des amonts simulés et des sockets locaux ; elles ne prouvent pas la disponibilité, les permissions ou le contrat d’une API distante. Aucun endpoint de test n’est ajouté au produit.
