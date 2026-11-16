# OPS-029 — Réaliser les audits Lighthouse desktop et mobile prioritaires

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023, OPS-028, WEB-006, DASH-004 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/lighthouse.ts`
- `webapp/scripts/quality/lighthouse.vitest.ts`
- `webapp/scripts/quality/lighthouse/profiles.json`
- `infra/docker/Dockerfile.lighthouse`
- `infra/docker/docker-compose.quality.yml`
- `codebase-integrity/README.md`

## Résultat et critères

Reprendre les enseignements des deux scripts Kazen, pas leurs pkill, versions npx flottantes, profils implicites ou suppression des rapports. Deux commandes desktop/mobile, Chrome et Lighthouse verrouillés, attente active, PID possédé et sortie isolée. Vérifier URL finale et contenu réellement audité ; cibler SSR Showcase, articles Client 2, connexion et page privée Dashboard sur session fictive. Trois mesures par route/profil, médiane, rapports JSON/HTML et métriques brutes ; pas de score terrain promis. Tester tous runtimeError et catégories requises absentes. Priorité humaine forte.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Au découpage initial, la réalisation attendait les commits amont. Ces dépendances sont désormais disponibles ; les preuves de réalisation figurent ci-dessous.

Depuis webapp/ : bun run verify -- lighthouse --profile desktop ; bun run verify -- lighthouse --profile mobile ; bun run test scripts/quality/lighthouse.vitest.ts. Contre-exemples : JSON invalide, interstitiel, mauvaise page finale, audit absent et processus étranger. Puis deux profils réels sur builds SSR reconstruits, versions et URL finales consignées. Politique confirmée le 2026-11-15 : erreurs d’exécution bloquantes ; scores initiaux informatifs, budgets à choisir explicitement après examen des premières mesures (voir analyse).

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Mesures et contrôle du contenu

Lighthouse 13.0.1, Chromium 151.0.7922.34, image Playwright épinglée par empreinte. Versions inconnues et erreurs runtime refusées. Les catégories et métriques doivent être présentes ; URL finale exacte, texte rendu de la fixture et main unique sont vérifiés par un audit personnalisé dans le navigateur réellement audité. Aucun pkill, npx flottant ou suppression de rapport antérieur. Les seuls processus et conteneurs possédés sont arrêtés.

Onze tests Lighthouse réussis ; ensemble de 58 tests des lanceurs et contrôles de cette reprise réussis. Types stricts, lint et formatage ciblés réussis. Trois observations par route/profil : 24 audits retenus, six campagnes complètes ; toutes les vérifications d’exécution et de contenu passent. Les premières tentatives Showcase ont révélé une préparation incomplète des médias et du catalogue ; rapports conservés, puis mesures refaites avec médias publics locaux et catalogue de test vide. Aucune source ni média utilisateur modifié.

Les profils utilisent un viewport desktop ou mobile et le débit/CPU fourni par le poste, sans prétendre reproduire un téléphone réel. Matériel et métriques brutes dans les rapports. Client 2 utilise une liste publiée vide ; Dashboard privé utilise une vraie session BFF sur API fictive locale. Le SEO Dashboard est volontairement limité par son interdiction d’indexation. Scores informatifs, aucun budget adopté, aucune validation humaine implicite.

```json
[
  {
    "target": "client2-immobilier",
    "profile": "desktop",
    "report": "webapp/.tmp/quality/lighthouse/client2-immobilier-desktop-1794755619457/summary.json",
    "sha256": "b5d3e022ba6b5e8da3b6ac37926ccef38a994ee828e1e68eee15e61228b7d9c5",
    "routes": [
      {
        "name": "articles",
        "url": "http://127.0.0.1:19853/fr/articles",
        "median": {
          "scores": {
            "performance": 1,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.91
          },
          "metrics": {
            "first-contentful-paint": 57.576,
            "largest-contentful-paint": 57.576,
            "cumulative-layout-shift": 0,
            "total-blocking-time": 0,
            "speed-index": 58
          }
        }
      }
    ]
  },
  {
    "target": "client2-immobilier",
    "profile": "mobile",
    "report": "webapp/.tmp/quality/lighthouse/client2-immobilier-mobile-1794755684546/summary.json",
    "sha256": "255181a57eeaafa45a862811e3f81df1a31eb9f5e9cb8c3eaca057184a687f9e",
    "routes": [
      {
        "name": "articles",
        "url": "http://127.0.0.1:19853/fr/articles",
        "median": {
          "scores": {
            "performance": 1,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.91
          },
          "metrics": {
            "first-contentful-paint": 83.473,
            "largest-contentful-paint": 83.473,
            "cumulative-layout-shift": 0,
            "total-blocking-time": 0,
            "speed-index": 84
          }
        }
      }
    ]
  },
  {
    "target": "dashboard",
    "profile": "desktop",
    "report": "webapp/.tmp/quality/lighthouse/dashboard-desktop-1794755194745/summary.json",
    "sha256": "0639d804aae69e856e92f60cabd069953a6867a9f7f17c2f9167cc5f73071f8f",
    "routes": [
      {
        "name": "connexion",
        "url": "http://127.0.0.1:19851/connexion",
        "median": {
          "scores": {
            "performance": 1,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.58
          },
          "metrics": {
            "first-contentful-paint": 203.203,
            "largest-contentful-paint": 203.203,
            "cumulative-layout-shift": 0.0025704208803957623,
            "total-blocking-time": 38.502000000000066,
            "speed-index": 209
          }
        }
      },
      {
        "name": "prive",
        "url": "http://127.0.0.1:19851/",
        "median": {
          "scores": {
            "performance": 0.68,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.58
          },
          "metrics": {
            "first-contentful-paint": 267.871,
            "largest-contentful-paint": 1955.466,
            "cumulative-layout-shift": 1.666900154685813e-05,
            "total-blocking-time": 516.3100000000001,
            "speed-index": 768
          }
        }
      }
    ]
  },
  {
    "target": "dashboard",
    "profile": "mobile",
    "report": "webapp/.tmp/quality/lighthouse/dashboard-mobile-1794755388816/summary.json",
    "sha256": "95c39816826578e80910011aeaa398f714f5f3f860e8847be10c2b529c2956d7",
    "routes": [
      {
        "name": "connexion",
        "url": "http://127.0.0.1:19851/connexion",
        "median": {
          "scores": {
            "performance": 1,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.58
          },
          "metrics": {
            "first-contentful-paint": 158.425,
            "largest-contentful-paint": 158.425,
            "cumulative-layout-shift": 0.0004701598386802771,
            "total-blocking-time": 33.17599999999999,
            "speed-index": 163
          }
        }
      },
      {
        "name": "prive",
        "url": "http://127.0.0.1:19851/",
        "median": {
          "scores": {
            "performance": 0.75,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.54
          },
          "metrics": {
            "first-contentful-paint": 278.704,
            "largest-contentful-paint": 2513.473,
            "cumulative-layout-shift": 0,
            "total-blocking-time": 811.3090000000004,
            "speed-index": 756
          }
        }
      }
    ]
  },
  {
    "target": "showcase-immobilier",
    "profile": "desktop",
    "report": "webapp/.tmp/quality/lighthouse/showcase-immobilier-desktop-1794756527717/summary.json",
    "sha256": "c4f519040674e018a961b49838fbe7af0dc0a6d525f56bc3497378e97d69fb9b",
    "routes": [
      {
        "name": "accueil",
        "url": "http://127.0.0.1:19854/fr",
        "median": {
          "scores": {
            "performance": 0.92,
            "accessibility": 1,
            "best-practices": 1,
            "seo": 0.61
          },
          "metrics": {
            "first-contentful-paint": 284.552,
            "largest-contentful-paint": 284.552,
            "cumulative-layout-shift": 6.780864197530865e-05,
            "total-blocking-time": 119.72199999999987,
            "speed-index": 2752
          }
        }
      }
    ]
  },
  {
    "target": "showcase-immobilier",
    "profile": "mobile",
    "report": "webapp/.tmp/quality/lighthouse/showcase-immobilier-mobile-1794756623885/summary.json",
    "sha256": "51dd5af9f1b5468fe9f40b452dbc4b1161e3b0368fdd05f2378d8f31194ed59e",
    "routes": [
      {
        "name": "accueil",
        "url": "http://127.0.0.1:19854/fr",
        "median": {
          "scores": {
            "performance": 0.99,
            "accessibility": 0.96,
            "best-practices": 1,
            "seo": 0.61
          },
          "metrics": {
            "first-contentful-paint": 257.588,
            "largest-contentful-paint": 257.588,
            "cumulative-layout-shift": 0.0002139075358560265,
            "total-blocking-time": 111.30500000000006,
            "speed-index": 877
          }
        }
      }
    ]
  }
]
```

Accompagnements nécessaires : exceptions précises pour les deux sources de contrôle dans le motif Git qui ignorait tous les fichiers lighthouse.*, et mode natif dans l’image qualité pour éviter tout accès au socket Docker depuis le conteneur. Les métadonnées de cette image sont raccordées par OPS-030. Les audits de dépendances des lockfiles ne couvrent pas les paquets installés dans les images Docker.
