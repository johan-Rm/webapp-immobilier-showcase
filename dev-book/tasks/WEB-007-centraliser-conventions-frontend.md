# WEB-007 — Répartir les conventions partagées dans le socle

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Couche : web
- Branche : layers/web
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/web`
- Périmètre autorisé : README général et spécialisés du socle frontend, anciens README frontend de Showcase et références dans les README Web déjà affectés.
- Dépendances : aucune nouvelle dépendance de code ; reprend les changements documentaires identifiés de WEB-006 sans les copier dans une autre couche.
- Base : `ca571d60c39b8b5932d74cd43dcbe4131c47c578`
- État : documents communs rédigés et commités, à vérifier ; raccordement DevOps différé.

## Résultat et critères

Décision explicite de l’humain : définir les conventions communes dans le socle plutôt que dans une application cliente ; plusieurs README par responsabilité, autorisés dans les sous-dossiers du socle. Les applications peuvent rester vides sans perdre les règles applicables. Cela ne crée pas une layer Nuxt chargée automatiquement.

## Réalisation et preuves

Dix README : général, composants, composables, pages, layouts, ressources graphiques, middleware, plugins, stores et utilitaires. Les anciennes définitions frontend sont retirées de Showcase pour ne pas dupliquer les règles ; les particularités de résolution des locales et de chargement différé restent dans le README du site. Le catalogue immobilier conserve sa responsabilité métier propre. Les références des README Web déjà modifiés sont actualisées.

Contrôle ciblé en lecture seule avec le vérificateur DevOps : dix nouveaux README acceptés, profondeur et forme comprises ; diff sans erreur d’espacement. Aucun fichier applicatif modifié par cette reprise documentaire. La compatibilité de Nuxt, le comportement des contrôles applicatifs et l’intégration globale ne sont pas prouvés par ce contrôle documentaire.

Douze sources du registre Codebase Integrity pointent encore vers les anciennes sections frontend. Leur migration et celle des guides relevant de DevOps dépendent de la disponibilité des documents Web par commit validé ; aucun document non commité n’a été copié dans DevOps. Le contrôle global de la branche Web n’est donc pas déclaré conforme. La correspondance des sources est consignée dans `tmp/migration-conventions-frontend.json` du principal.

## Verdict humain

Aucun verdict sur l’implémentation ou le contenu des nouveaux README. L’organisation documentaire proposée est approuvée.

## Commits

Commit local distinct créé à l’implémentation ; SHA réel dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

Reprise du workflow le 2026-11-15 : commits techniques autorisés avant vérification humaine globale ; cette carte préparée est rattachée à sa couche, sans duplication ni transfert de code applicatif non commité. Les états et consignes antérieurs décrivent l’ancien workflow.

Complément du 2026-11-15 : suppression des README profonds de contenus, fixtures et médias selon la règle confirmée ; leurs explications sont transférées dans le guide documentaire DevOps à partir des sources déjà commitées. La convention durable de préparation non destructive des démonstrations est regroupée au README des sites. Aucun contenu de démonstration, média ni code supprimé.
