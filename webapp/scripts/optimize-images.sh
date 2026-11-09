#!/usr/bin/env bash

set -euo pipefail

DIR="${1:-public/images}"
BACKUP_DIR="${DIR}__backup"

MAX_WIDTH=2560
QUALITY=70

echo "Optimisation du dossier : $DIR"

if [ ! -d "$BACKUP_DIR" ]; then
  cp -a "$DIR" "$BACKUP_DIR"
  echo "Backup créé : $BACKUP_DIR"
else
  echo "Backup déjà existant : $BACKUP_DIR"
fi

find "$DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r file; do
  before=$(stat -c%s "$file")

  convert "$file" \
    -auto-orient \
    -strip \
    -resize "${MAX_WIDTH}x>" \
    -quality "$QUALITY" \
    "$file"

  after=$(stat -c%s "$file")

  echo "$(du -h "$file" | cut -f1) | $file | gain: $(( (before - after) / 1024 )) KB"
done

echo "Optimisation terminée ✅"