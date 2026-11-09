#!/usr/bin/env bash
#
# Ajoute, a cote de chaque page d accueil deja exportee, une variante ou le
# menu principal est ouvert.
#
# Le menu s ouvre normalement au clic : sans script, il reste inaccessible.
# Cette passe regenere le site avec le menu deja ouvert, puis ne conserve que
# les accueils, deposes sous le nom menu-ouvert.html.
#
# Usage : bash scripts/build/variante-menu.sh <dossier_export>

set -euo pipefail

OUT_DIR="${1:?dossier d export requis}"

export NODE_ENV=production
export STATIC_OUTPUT=true
export STATIC_MENU_OPEN=true

VARIANT_DIR="$(mktemp -d)"
trap 'rm -rf "$VARIANT_DIR"' EXIT

bun run generate >/dev/null 2>&1
cp -r .output/public/. "$VARIANT_DIR"/
bun scripts/build/maquette-html.ts "$VARIANT_DIR" >/dev/null

count=0
pages=$(find "$VARIANT_DIR" -mindepth 2 -maxdepth 2 -name index.html)

for page in $pages; do
  relative=${page#"$VARIANT_DIR"/}
  directory=$(dirname "$relative")

  if [ -f "$OUT_DIR/$directory/index.html" ]; then
    cp "$page" "$OUT_DIR/$directory/menu-ouvert.html"
    count=$((count + 1))
  fi
done

echo "      $count accueils doubles en menu-ouvert.html"
