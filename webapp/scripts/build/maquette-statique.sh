#!/usr/bin/env bash
#
# Produit une maquette HTML autonome du site, ouvrable sans serveur.
#
# Le pre-rendu de Nuxt n'est pas utilise : il s'interrompt avant de construire la
# sortie finale, et echoue en erreur 500 sur les listes de biens que le meme
# serveur rend pourtant correctement (constate le 2026-09-04, cf. carte 041).
# On construit donc le site normalement, puis on capture ses pages en
# l'interrogeant comme le ferait un visiteur.
#
# Usage : bash scripts/build/maquette-statique.sh [dossier_sortie]

set -euo pipefail

OUT_DIR="${1:-.output/public}"
CAPTURE_PORT="${CAPTURE_PORT:-3199}"
FALLBACK_PORT="${FALLBACK_PORT:-3198}"
BASE_URL="http://127.0.0.1:${CAPTURE_PORT}"
FALLBACK_URL="http://127.0.0.1:${FALLBACK_PORT}"

export NODE_ENV=production

echo "[1/4] Build du site"
bun run build
echo

echo "[2/4] Demarrage des serveurs (capture + repli)"
PORT="$CAPTURE_PORT" NITRO_PORT="$CAPTURE_PORT" NUXT_PUBLIC_STATIC_OUTPUT=true \
  node .output/server/index.mjs >/dev/null 2>&1 &
SERVER_PID=$!

# Serveur de repli, en rendu normal : reprend les pages dont le rendu casse
# lorsque les donnees sont chargees cote serveur.
PORT="$FALLBACK_PORT" NITRO_PORT="$FALLBACK_PORT" \
  node .output/server/index.mjs >/dev/null 2>&1 &
FALLBACK_PID=$!

trap 'kill "$SERVER_PID" "$FALLBACK_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  if curl -sf --max-time 2 "${BASE_URL}/fr" -o /dev/null; then break; fi
  sleep 0.5
done

if ! curl -sf --max-time 5 "${BASE_URL}/fr" -o /dev/null; then
  echo "      ECHEC : le serveur ne repond pas sur ${BASE_URL}" >&2
  exit 1
fi
echo "      serveur pret sur ${BASE_URL}"

echo "[3/4] Capture des pages et de la feuille de couleurs"
bun scripts/build/capture-pages.ts "$BASE_URL" "$OUT_DIR" "$FALLBACK_URL"

curl -sf --max-time 10 "${BASE_URL}/themes.css" -o "$OUT_DIR/themes.css"
if [ ! -s "$OUT_DIR/themes.css" ]; then
  echo "      ECHEC : themes.css non recupere" >&2
  exit 1
fi
echo "[capture] themes.css fige ($(wc -c < "$OUT_DIR/themes.css") octets)"

kill "$SERVER_PID" "$FALLBACK_PID" 2>/dev/null || true
trap - EXIT

echo
echo "[4/4] Post-traitement (autonomie fichier)"
bun scripts/build/maquette-html.ts "$OUT_DIR"

echo
echo "Maquette prete : $OUT_DIR"
echo "Ouvrir directement : $OUT_DIR/fr/index.html"
