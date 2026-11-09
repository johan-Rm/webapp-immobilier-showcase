#!/usr/bin/env sh
# ==============================================================================
# Préflight de déploiement preprod / prod.
#
# Validation de configuration AVANT build/up :
#   - fichier d'environnement présent
#   - secret de session réel (>= 32 caractères, pas le placeholder d'exemple)
#   - identités Docker distinctes des défauts de dev (anti-collision preprod/prod)
#   - dossiers hôtes montés (médias, contenu) existants
#   - dossier .data présent (persistance des demandes de contact)
#   - `docker compose config` valide (interpolation + vars requises)
#
# Usage : deploy-check.sh <env-file> <compose-file> <label>
#   ex.  : deploy-check.sh webapp/.env.prod infra/docker/docker-compose.prod.yml prod
# ==============================================================================

set -eu

ENV_FILE="${1:?Usage: deploy-check.sh <env-file> <compose-file> <label>}"
COMPOSE_FILE="${2:?Usage: deploy-check.sh <env-file> <compose-file> <label>}"
LABEL="${3:-deploy}"

errors=0
warnings=0

fail() {
  printf '  \033[0;31m✗\033[0m %s\n' "$1"
  errors=$((errors + 1))
}

warn() {
  printf '  \033[0;33m!\033[0m %s\n' "$1"
  warnings=$((warnings + 1))
}

ok() {
  printf '  \033[0;32m✓\033[0m %s\n' "$1"
}

# Lit une clé dans le fichier d'env (dernière occurrence), sans exécuter le fichier.
# Retire les quotes simples/doubles entourantes éventuelles.
getenv() {
  key="$1"
  grep -E "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null \
    | tail -n 1 \
    | sed -E "s/^[[:space:]]*${key}=//; s/^\"(.*)\"$/\1/; s/^'(.*)'$/\1/"
}

printf '\n\033[0;36m━━ Préflight %s (%s) ━━\033[0m\n' "$LABEL" "$ENV_FILE"

# --- Fichier d'environnement -------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  fail "Fichier d'environnement absent : $ENV_FILE (cp .env.example $ENV_FILE puis adapter)"
  printf '\n\033[0;31m%d erreur(s). Déploiement %s bloqué.\033[0m\n\n' "$errors" "$LABEL"
  exit 1
fi
ok "Fichier d'environnement présent"

# --- Secret de session -------------------------------------------------------
SESSION_PWD="$(getenv NUXT_SESSION_PASSWORD)"
case "$SESSION_PWD" in
  '' )
    fail "NUXT_SESSION_PASSWORD vide" ;;
  'password-with-at-least-32-characters' | 'change-me-generate-a-32-characters-min-secret' )
    fail "NUXT_SESSION_PASSWORD encore au placeholder d'exemple — générer un vrai secret (openssl rand -base64 48)" ;;
  * )
    if [ "${#SESSION_PWD}" -lt 32 ]; then
      fail "NUXT_SESSION_PASSWORD trop court (${#SESSION_PWD} car., minimum 32)"
    else
      ok "NUXT_SESSION_PASSWORD défini (${#SESSION_PWD} car.)"
    fi ;;
esac

# --- Identités Docker distinctes des défauts de dev --------------------------
check_distinct() {
  key="$1"
  dev_default="$2"
  value="$(getenv "$key")"
  if [ -z "$value" ]; then
    fail "$key vide"
  elif [ "$value" = "$dev_default" ]; then
    fail "$key=$value identique au défaut de dev — utiliser une valeur propre à $LABEL (anti-collision)"
  else
    ok "$key=$value"
  fi
}
check_distinct COMPOSE_PROJECT_NAME showcase-immobilier-dev
check_distinct APP_STACK_NETWORK_NAME showcase_immobilier_network_dev
check_distinct EDGE_ALIAS showcase-immobilier-dev

# --- Dossiers hôtes montés ---------------------------------------------------
PROJECT_DIR="$(unset CDPATH; cd "$(dirname "$0")/../../../.." && pwd)"

check_host_dir() {
  key="$1"
  default="$2"
  must_exist="$3" # yes | create
  value="$(getenv "$key")"
  [ -z "$value" ] && value="$default"
  case "$value" in
    /*) path="$value" ;;
    *)  path="$PROJECT_DIR/$value" ;;
  esac
  if [ -d "$path" ]; then
    ok "$key → $path"
  elif [ "$must_exist" = "create" ]; then
    mkdir -p "$path" && ok "$key → $path (créé)"
  else
    fail "$key → $path inexistant (Docker créerait un dossier vide)"
  fi
}
media_default=./webapp/public/images
if [ "$LABEL" = "preprod" ]; then
  media_default=/var/www/graines-digitales/webapps/showcase-immobilier/webapp/public/images
fi
check_host_dir MEDIA_HOST_DIR "$media_default" yes
check_host_dir CONTENT_HOST_DIR ./webapp/content yes
check_host_dir DATA_HOST_DIR ./webapp/.data create

# --- Avertissements non bloquants : creds applicatives -----------------------
for key in SYMFONY_API_URL SYMFONY_PROJECT_ID SYMFONY_SERVICE_EMAIL SYMFONY_SERVICE_PASSWORD RESEND_API_KEY; do
  [ -z "$(getenv "$key")" ] && warn "$key vide (fonctionnalité associée indisponible)"
done

# --- Validation de la configuration Compose ----------------------------------
# ENV_FILE est exporté pour résoudre `env_file: ${ENV_FILE:-...}` vers le fichier validé.
config_err="$(mktemp)"
if ENV_FILE="$ENV_FILE" docker compose --project-directory "$PROJECT_DIR" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config -q >/dev/null 2>"$config_err"; then
  ok "docker compose config valide"
else
  fail "docker compose config invalide :"
  sed 's/^/      /' "$config_err"
fi
rm -f "$config_err"

# --- Verdict -----------------------------------------------------------------
printf '\n'
if [ "$errors" -gt 0 ]; then
  printf '\033[0;31m%d erreur(s), %d avertissement(s). Déploiement %s bloqué.\033[0m\n\n' \
    "$errors" "$warnings" "$LABEL"
  exit 1
fi
printf '\033[0;32mPréflight %s OK\033[0m (%d avertissement(s)).\n\n' "$LABEL" "$warnings"
