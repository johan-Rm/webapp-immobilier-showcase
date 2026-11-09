#!/usr/bin/env bash
#
# Ajoute, a cote de chaque fiche de bien deja exportee, une variante ou le
# panneau de details est ouvert.
#
# Ce panneau s ouvre normalement au clic et repose sur une fenetre modale, qui
# n est jamais rendue cote serveur : il est donc absent du livrable. Cette passe
# regenere le site avec le panneau rendu directement, puis ne conserve que les
# fiches, deposees sous le nom panneau-ouvert.html.
#
# Usage : bash scripts/build/variante-panneaux.sh <dossier_export>

set -euo pipefail

OUT_DIR="${1:?dossier d export requis}"

export NODE_ENV=production
export STATIC_OUTPUT=true
export STATIC_PANELS_OPEN=true

VARIANT_DIR="$(mktemp -d)"
trap 'rm -rf "$VARIANT_DIR"' EXIT

bun run generate >/dev/null 2>&1
cp -r .output/public/. "$VARIANT_DIR"/
bun scripts/build/maquette-html.ts "$VARIANT_DIR" >/dev/null

count=0
pages=$(find "$VARIANT_DIR" -path "*properties/*" -mindepth 6 -name index.html)

for page in $pages; do
  relative=${page#"$VARIANT_DIR"/}
  directory=$(dirname "$relative")

  if [ -f "$OUT_DIR/$directory/index.html" ]; then
    cp "$page" "$OUT_DIR/$directory/panneau-ouvert.html"
    count=$((count + 1))
  fi
done

echo "      $count fiches doublees en panneau-ouvert.html"
