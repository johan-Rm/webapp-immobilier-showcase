# DEM-001 — Installer le cadre AIDE pour la webapp immobilière

- Type : consolidation
- Session de création : 01a1bfae-52b8-7281-847e-041c81c25a52
- État : validée par l’humain, intégration locale autorisée

## Besoin et décisions

Organiser les contributions IA autour de conventions vérifiables, de missions
isolées et de deux boucles : développement et consolidation. Le cadrage proposé
a été approuvé par l’humain dans cette session : « ok pour ta proposition ».
Le résultat final est validé le 2026-11-09 : « parfait tu peux tout commiter et fusionner sur develop ». Cette instruction autorise le commit et la fusion locale, sans push.

Conserver Nuxt dans `webapp/` et les standards existants. Retenir les couches Web,
BFF, Domaine et Devops ; garder Symfony dans son dépôt externe. Ne pas séparer
le dashboard de l’application publique à ce stade. Créer les worktrees uniquement
sur affectation, sans duplication de secrets ni création automatique d’agents.

L’amorçage reste sur `chore/regrouper-webapp`, à la demande de l’humain. La base est
`c365b4a6059c915ff639ffface5fa01c29fd6b3c`. Aucune fusion, action distante ou création
de commit du projet n’est autorisée par cette installation seule.

## Critères et carte

- OPS-001 : gouvernance commune, guides, modèles, routage et outillage testés.
- Extension demandée par l’humain : classement des conventions par domaine,
  liens vers les README et états de leurs points de contrôle, sans création
  de règles pour les domaines vides. À la demande humaine suivante, regrouper
  les vérificateurs et leurs tests par domaine, sans README dans les sous-dossiers.
- Exercer le créateur depuis une base connue et un worktree secondaire, sans
  écraser les dossiers occupés, fichiers locaux ou branches existantes.
- Préparer des environnements aux identités, ports et données distincts.
- Observer deux piles Nuxt simultanées dans un dépôt temporaire.
- Conserver les vérificateurs applicatifs, clarifier les deux échecs de tests
  et ajouter le contrôle de contribution avant les jobs applicatifs en CI.
- Regrouper Docker, Nginx et les Makefiles secondaires dans `infra/`, en conservant les commandes et les chemins runtime.
- Aucun changement à la pile active, aux secrets existants ou à la production.

## Vérification et livraison

Les preuves et le verdict humain sont consignés dans OPS-001. Le commit et la fusion locale dans develop sont autorisés ; aucune livraison distante n’est demandée.

## Déclaration de consolidation

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        ".github/workflows/ai-development-engineering.yml",
        ".github/workflows/conventions.yml",
        ".github/workflows/quality.yml",
        ".github/workflows/sonarqube.yml",
        "codebase-integrity/domaines/construction-livraison/scripts/check_commits.py",
        "codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py",
        "codebase-integrity/domaines/construction-livraison/scripts/check_demands.py",
        "codebase-integrity/domaines/construction-livraison/scripts/contribution.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_commits.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_contributions.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_demands.py",
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "convention": "codebase-integrity/README.md#contributions",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_contributions.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_commits.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    },
    {
      "chemins": [
        ".dockerignore",
        ".gitignore",
        ".ignore",
        "Dockerfile",
        "Dockerfile.dev",
        "Dockerfile.playwright",
        "Makefile.dev",
        "codebase-integrity/domaines/construction-livraison/scripts/check_runtime.py",
        "codebase-integrity/domaines/construction-livraison/scripts/deploy-check.sh",
        "codebase-integrity/domaines/construction-livraison/scripts/environment.py",
        "codebase-integrity/domaines/construction-livraison/scripts/worktrees.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_environment.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py",
        "docker-compose.dev.yml",
        "docker-compose.preprod.yml",
        "docker-compose.prod.yml",
        "infra/config/layers.json",
        "infra/docker/Dockerfile",
        "infra/docker/Dockerfile.dev",
        "infra/docker/Dockerfile.playwright",
        "infra/docker/docker-compose.dev.yml",
        "infra/docker/docker-compose.preprod.yml",
        "infra/docker/docker-compose.prod.yml",
        "infra/make/Makefile.ai-development-engineering",
        "infra/make/Makefile.dev",
        "infra/make/Makefile.preprod",
        "infra/make/Makefile.prod",
        "infra/nginx/certs/.gitkeep",
        "infra/nginx/vhost.conf",
        "nginx/certs/.gitkeep",
        "nginx/vhost.conf",
        "webapp/.dockerignore",
        "webapp/.prettierignore",
        "webapp/eslint.config.ts",
        "webapp/scripts/ci/deploy-check.sh",
        "webapp/vitest.config.ts"
      ],
      "convention": "codebase-integrity/README.md#worktrees-et-environnements",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_environment.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py",
        "codebase-integrity/domaines/construction-livraison/scripts/check_runtime.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts",
        "webapp/scripts/ci/app/verify-types-placement.ts"
      ],
      "convention": "webapp/app/README.md#placement-des-types",
      "controles": [
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/bun.lock",
        "codebase-integrity/commun/bootstrap.py",
        "codebase-integrity/commun/lint.ts",
        "codebase-integrity/commun/test_domains.py",
        "codebase-integrity/commun/validation-rules.ts",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/architecture-dependances/regles.yaml",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-no-business-logic.ts",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-no-framework-imports.ts",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-soc-components.ts",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-types-placement.test.ts",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-types-placement.vitest.ts",
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_registry.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_registry.py",
        "codebase-integrity/domaines/interface-internationalisation/regles.yaml",
        "codebase-integrity/domaines/interface-internationalisation/scripts/verify-app-image.ts",
        "codebase-integrity/domaines/qualite-code/regles.yaml",
        "codebase-integrity/domaines/qualite-code/scripts/verify-code-quality.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-no-redundant-guards.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-script-setup-standard.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-solid.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-script-setup-standard.test.ts",
        "codebase-integrity/eslint.config.ts",
        "codebase-integrity/package.json",
        "codebase-integrity/prettier.config.mjs",
        "codebase-integrity/vitest.config.ts",
        "webapp/scripts/ci/app/rules.yaml",
        "webapp/scripts/ci/app/validation-rules.ts",
        "webapp/scripts/ci/app/verify-app-image.ts",
        "webapp/scripts/ci/app/verify-code-quality.ts",
        "webapp/scripts/ci/app/verify-no-business-logic.ts",
        "webapp/scripts/ci/app/verify-no-redundant-guards.ts",
        "webapp/scripts/ci/app/verify-script-setup-standard.test.ts",
        "webapp/scripts/ci/app/verify-script-setup-standard.ts",
        "webapp/scripts/ci/app/verify-soc-components.ts",
        "webapp/scripts/ci/app/verify-solid.ts",
        "webapp/scripts/ci/app/verify-types-placement.test.ts",
        "webapp/scripts/ci/app/verify-types-placement.vitest.ts",
        "webapp/scripts/ci/services/rules.yaml",
        "webapp/scripts/ci/services/verify-no-framework-imports.ts"
      ],
      "convention": "codebase-integrity/README.md#classement-des-conventions",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_registry.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_registry.py",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-types-placement.vitest.ts"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        ".codex/config.toml",
        ".vscode/settings.json",
        "AGENTS.md",
        "Makefile",
        "Makefile.preprod",
        "Makefile.prod",
        "README.md",
        "codebase-integrity/README.md",
        "dev-book/README.md",
        "dev-book/templates/README.md",
        "dev-book/templates/carte.md",
        "dev-book/templates/demande.md",
        "docs/1.getting-started/ai-workflow.md",
        "docs/1.getting-started/setup-local.md",
        "docs/2.architecture/9.types-placement.md",
        "docs/3.application/ci-conventions-validation.md",
        "docs/3.application/sonarqube-cloud.md",
        "docs/README.md",
        "showcase-immobilier.code-workspace",
        "webapp/app/README.md",
        "webapp/package.json",
        "webapp/scripts/README.md",
        "webapp/services/README.md",
        "worktree/README.md"
      ],
      "motif": "Documenter les conventions et preuves ; adapter les références des guides, les commandes Make et les points d’entrée Bun à la nouvelle organisation, sans dupliquer les règles."
    }
  ],
  "sans_correction": ""
}
```
