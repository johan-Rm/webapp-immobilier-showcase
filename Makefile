SHELL := /bin/bash

TAIL ?= 200
FOLLOW ?= -f

include infra/make/Makefile.dev
include infra/make/Makefile.preprod
include infra/make/Makefile.prod
include infra/make/Makefile.ai-development-engineering

.PHONY: help

help:
	@printf "\n"
	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf " 🚀 WEBAPP NUXT - COMMANDES DISPONIBLES\n"
	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf "\n"

	@printf "🔧 Commandes communes\n\n"
	@printf "  Cadre AIDE : AGENTS.md et skills AIDE\n"
	@printf "  lane-status [COUCHE]       État local Git, Docker et missions\n"
	@printf "  lane-up COUCHE             Démarrer une lane en développement\n"
	@printf "  lane-down COUCHE           Arrêter sa pile, conserver les données\n"
	@printf "  lane-logs COUCHE           Suivre les logs de sa pile\n"
	@printf "  lane-rebuild COUCHE        Reconstruire puis relancer\n"
	@printf "  demands                    Demandes locales non livrées ou état incertain\n"
	@printf "  tasks [DEM-NNN]            Cartes en cours ou détail d’une demande\n"
	@printf "  quality-check               Lint + Format + Type Check\n"
	@printf "  quality-lint-check          ESLint\n"
	@printf "  quality-lint-fix            ESLint Fix\n"
	@printf "  quality-format-check        Prettier\n"
	@printf "  quality-type-check          Vue TSC\n"
	@printf "  quality-conventions-check   Vérification conventions\n"
	@printf "  quality-generate-schemas    Génération des schémas\n"
	@printf "  maquette-html               Maquette HTML autonome (restitution)\n"
	@printf "  generate-static             Génération statique du site (nuxt generate)\n"
	@printf "  export-maquette DEST=…      Maquette autonome exportée vers un dossier\n"
	@printf "\n"

	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf "\n"

	@printf "📦 DEV\n\n"
	@printf "  dev-webapp-localhost        Nuxt HMR dans Docker\n"
	@printf "  dev-webapp-ssr              SSR via Nginx (mode prod-like)\n"
	@printf "  dev-nginx                   Nginx uniquement\n"
	@printf "\n"

	@printf "🔨 Build DEV\n\n"
	@printf "  dev-build                   Build toutes les images dev\n"
	@printf "  dev-build-no-cache          Build toutes les images dev sans cache\n"
	@printf "  dev-build-localhost         Build image HMR uniquement\n"
	@printf "  dev-build-localhost-no-cache Build image HMR sans cache\n"
	@printf "  dev-build-ssr               Build image SSR uniquement\n"
	@printf "  dev-build-ssr-no-cache      Build image SSR sans cache\n"
	@printf "\n"

	@printf "📜 Logs & Debug\n\n"
	@printf "  dev-logs                    Suivre les logs dev\n"
	@printf "  dev-analyze                 Analyse du bundle Nuxt\n"
	@printf "  dev-playwright              Tests navigateur Playwright dans Docker\n"
	@printf "  dev-playwright-report       Ouvrir le rapport Playwright local\n"
	@printf "\n"

	@printf "🐚 Shell\n\n"
	@printf "  dev-shell-webapp-localhost  Shell container dev\n"
	@printf "  dev-shell-webapp-ssr        Shell container SSR\n"
	@printf "  dev-shell-nginx             Shell container Nginx\n"
	@printf "\n"

	@printf "📄 Contenu DEV\n\n"
	@printf "  dev-content-sync            Synchroniser le contenu DEV\n"
	@printf "  dev-content-sync-dry        Simulation DEV sans écriture\n"
	@printf "\n"

	@printf "🧹 Lifecycle\n\n"
	@printf "  dev-down                    Stopper les containers Docker dev\n"
	@printf "\n"

	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf "\n"

	@printf "🚧 PREPROD\n\n"
	@printf "  preprod-check               Préflight config (bloquant avant deploy)\n"
	@printf "  preprod-up                  Lancer les services preprod\n"
	@printf "  preprod-up-build            Lancer les services preprod avec rebuild\n"
	@printf "  preprod-build               Builder les images preprod\n"
	@printf "  preprod-build-no-cache      Builder les images preprod sans cache\n"
	@printf "  preprod-deploy              Build + lancement preprod\n"
	@printf "  preprod-deploy-no-cache     Build sans cache + lancement preprod\n"
	@printf "\n"

	@printf "📄 Contenu PREPROD\n\n"
	@printf "  preprod-content-sync        Synchroniser le contenu PREPROD\n"
	@printf "  preprod-content-sync-dry    Simulation PREPROD sans écriture\n"
	@printf "\n"

	@printf "📜 Logs & Shell\n\n"
	@printf "  preprod-logs                Suivre les logs preprod\n"
	@printf "  preprod-logs-webapp         Suivre les logs webapp SSR preprod\n"
	@printf "  preprod-logs-service S=...  Suivre les logs d'un service preprod\n"
	@printf "\n"

	@printf "🧹 Lifecycle\n\n"
	@printf "  preprod-down                Stopper les containers preprod\n"
	@printf "  preprod-stop                Stopper sans supprimer les containers preprod\n"
	@printf "  preprod-clean               Supprimer containers, volumes et orphelins preprod\n"
	@printf "  preprod-status              Afficher l'état des services preprod\n"
	@printf "\n"

	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf "\n"

	@printf "🏭 PROD\n\n"
	@printf "  prod-check                  Préflight config (bloquant avant deploy)\n"
	@printf "  prod-up                     Lancer les services prod\n"
	@printf "  prod-up-build               Lancer la prod avec rebuild\n"
	@printf "  prod-build                  Builder les images prod\n"
	@printf "  prod-build-no-cache         Builder les images prod sans cache\n"
	@printf "  prod-deploy                 Build + lancement prod\n"
	@printf "  prod-deploy-no-cache        Build sans cache + lancement prod\n"
	@printf "\n"

	@printf "📄 Contenu PROD\n\n"
	@printf "  prod-content-sync           Synchroniser le contenu PROD\n"
	@printf "  prod-content-sync-dry       Simulation PROD sans écriture\n"
	@printf "\n"

	@printf "📜 Logs & Shell\n\n"
	@printf "  prod-logs                   Suivre les logs prod\n"
	@printf "  prod-logs-webapp            Suivre les logs webapp SSR prod\n"
	@printf "  prod-logs-service S=...     Suivre les logs d'un service prod\n"
	@printf "\n"

	@printf "🧹 Lifecycle\n\n"
	@printf "  prod-down                   Stopper les containers prod\n"
	@printf "  prod-stop                   Stopper sans supprimer les containers prod\n"
	@printf "  prod-clean                  Supprimer containers, volumes et orphelins prod\n"
	@printf "  prod-status                 Afficher l'état des services prod\n"
	@printf "\n"

	@printf "═══════════════════════════════════════════════════════════════\n"
	@printf "\n"
