#!/usr/bin/env sh
set -e

PORT="${NITRO_PORT:-3000}"
HOST="${NITRO_HOST:-0.0.0.0}"
PUBLIC_HOST="${PUBLIC_HOST:-localhost}"
PUBLIC_PORT="${PUBLIC_PORT:-3001}"
SITE_NAME="${SITE_NAME:-Nuxt}"

cyan='\033[0;36m'
green='\033[0;32m'
reset='\033[0m'

echo "${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
echo "${green}${SITE_NAME} Nuxt SSR ready${reset}"
echo "  Internal : http://${HOST}:${PORT}"
echo "  Host     : http://${PUBLIC_HOST}:${PUBLIC_PORT}"
echo "${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"

exec node .output/server/index.mjs
