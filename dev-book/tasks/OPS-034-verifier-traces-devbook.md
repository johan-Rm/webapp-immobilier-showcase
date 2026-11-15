# OPS-034 — Vérifier les traces des cartes

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-15
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- Base : `ca571d60c39b8b5932d74cd43dcbe4131c47c578`
- Périmètre autorisé : cette carte, le script check_devbook et ses tests dans construction-livraison, le README et modèle de carte du dev-book, le champ de périmètre d’OPS-032, le registre des conventions, le Makefile AIDE et les documents explicatifs de cette reprise.
- Dépendances : aucune dépendance de code nouvelle ; reprise identifiée DEM-011.
- État : implémentée, non commitée, à vérifier.

## Résultat et critères

Proposition explicitement validée par l’humain : vérifier la couverture existante avant d’ajouter les contrôles manquants sur l’identification des missions, les références des verdicts et les suppressions ou renommages de cartes. Le contrôle des types des demandes et celui des contributions sont conservés ; aucune copie de leurs tests.

## Réalisation et preuves

Le contrôle complémentaire exige une base Git complète et explicite et ne réinterprète pas les cartes inchangées. Il vérifie les métadonnées, la structure de verdicts déclarés, l’existence des commits référencés ou l’empreinte du fichier de preuve. Les suppressions et renommages de cartes sont bloquants et requièrent un arbitrage ; aucun contournement automatique. L’authenticité du verdict, la portée sémantique et les empreintes internes d’un manifeste ne sont pas prouvées.

Commande réelle : `make devbook-check BASE=ca571d60c39b8b5932d74cd43dcbe4131c47c578`. Les tests du vérificateur sont inclus dans les tests Python d’aide-check ; le contrôle réel nécessite la commande distincte avec base explicite. Guide de référence : `docs/verifier-traces-devbook.md`. Première exécution : 15 cartes, périmètre non structuré d’OPS-032 détecté puis rendu explicite, sans extension. Huit nouveaux tests réussis dans des dépôts Git temporaires, sans remote : métadonnées, exemples insuffisants, attente de verdict, référence Git, empreinte altérée, renommage et carte indexée invalide.

Vérification finale : 16 cartes nouvelles ou modifiées contrôlées, aucun écart ; registre cohérent ; 145 tests Python réussis, dont huit dédiés à cette extension. README du dev-book, structure et liens des documents de la reprise contrôlés. Contenu présenté identifié dans `tmp/etat-implementation-traces-devbook.json` du principal. Le contrôle réel ne prouve pas l’authenticité d’un verdict humain.

## Verdict humain

Aucun verdict sur l’implémentation. La proposition de couverture est validée ; ce n’est pas une validation du code.

## Commits

Aucun ; aucun push, PR ou fusion.

Reprise du 2026-11-15 : les premiers verdicts déjà écrits d’OPS-008 et OPS-012 sont transcrits en structure, sans nouveau verdict ni extension de portée ; les SHA complets étaient déjà dans les traces. Commit technique local à l’implémentation, à vérifier humainement.
