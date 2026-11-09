# SonarQube Cloud

- Role: documenter l analyse qualite generale par SonarQube Cloud.
- Related: [./ci-conventions-validation.md](ci-conventions-validation.md), [../../sonar-project.properties](../../sonar-project.properties)

## Intent

SonarQube Cloud complete les controles locaux du projet.

Les scripts `scripts/ci/app/` et leurs regles YAML protegent les conventions specifiques
au projet. SonarQube Cloud analyse la qualite generale : dette technique, duplications,
maintenabilite, securite et bugs potentiels.

## GitHub Configuration

Le workflow `.github/workflows/sonarqube.yml` attend :

- un secret GitHub `SONAR_TOKEN`
- une variable GitHub `SONAR_ORGANIZATION`
- une variable GitHub `SONAR_PROJECT_KEY`

Ces valeurs sont creees depuis l interface SonarQube Cloud lors de l import du depot.

## Scope

La configuration racine `sonar-project.properties` analyse :

- `app/`
- `server/`
- `services/`
- `shared/`
- `schemas/`
- `scripts/`
- `docs/`

Les dossiers de build, dependances, fichiers temporaires, couverture et interfaces generees
sont exclus de l analyse.

## Operating Rule

Les regles projet tres specifiques restent dans les YAML de `scripts/ci/app/`.

SonarQube ne doit pas devenir le proprietaire des conventions locales comme la structure
`script setup`, le placement des types ou les contraintes propres a `<AppImage>`.
