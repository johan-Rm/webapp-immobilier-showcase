#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="public/images"
mkdir -p "$OUTPUT_DIR"

download_image() {
  local filename="$1"
  local url="$2"
  local output="${OUTPUT_DIR}/${filename}"

  echo "⬇️  $filename"

  if ! curl -L --fail --silent --show-error \
    --retry 2 \
    --retry-delay 1 \
    --output "$output" \
    "$url"; then
    echo "⚠️  Ignoré (erreur téléchargement) : $filename"
    rm -f "$output"
    return
  fi
}

while IFS="|" read -r filename url; do
  filename="$(printf '%s' "$filename" | tr -d '\r' | xargs)"
  url="$(printf '%s' "$url" | tr -d '\r' | xargs)"

  [ -z "$filename" ] && continue
  [ -z "$url" ] && continue
  [[ "$filename" == \#* ]] && continue

  download_image "$filename" "$url"

done <<'EOF'
affaire-commerciale-boutique-centre-01.jpg|https://images.unsplash.com/photo-1699533134685-a4e9a968d508?fm=jpg&q=80&w=1600&auto=format&fit=crop
maison-familiale-ghazoua-02.jpg|https://images.unsplash.com/photo-1544234674-d099c6efdb0d?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-marina-essaouira-01.jpg|https://images.unsplash.com/photo-1699533136334-296a61a40216?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-vue-remparts-medina-01.jpg|https://images.unsplash.com/photo-1675015009493-d133df7756f9?fm=jpg&q=80&w=1600&auto=format&fit=crop

affaire-commerciale-cafe-medina-03.jpg|https://images.unsplash.com/photo-1730149714813-36c94927741e?fm=jpg&q=80&w=1600&auto=format&fit=crop
maison-de-ville-sidi-kaouki-01.jpg|https://images.unsplash.com/photo-1513028273141-1d47d2b111b8?fm=jpg&q=80&w=1600&auto=format&fit=crop
riad-terrasse-remparts.jpeg|https://images.unsplash.com/photo-1699533136505-1bfca2bdee70?fm=jpg&q=80&w=1600&auto=format&fit=crop

maison-de-ville-sidi-kaouki-03.jpg|https://images.unsplash.com/photo-1706794441092-546fcfac05bd?fm=jpg&q=80&w=1600&auto=format&fit=crop
maison-familiale-ghazoua-01.jpg|https://images.unsplash.com/photo-1761692476571-5fc8b3f6ae24?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-balcon-centre-ville-01.jpg|https://images.unsplash.com/photo-1675618102510-d62fc29f53d4?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-jardin-marina-02.jpg|https://images.unsplash.com/photo-1661164358320-a6c1e19adc7e?fm=jpg&q=80&w=1600&auto=format&fit=crop

maison-ville-medina-terrasse-02.jpg|https://images.unsplash.com/photo-1527776831052-5d44d2d0c96e?fm=jpg&q=80&w=1600&auto=format&fit=crop
terrain-viabilise-route-marrakech-03.jpg|https://images.unsplash.com/photo-1762380371769-99c632750946?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-marina-terrasse-filante-01.jpg|https://images.unsplash.com/photo-1506591608813-bf1cc7ee7400?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-marina-terrasse-filante-03.jpg|https://images.unsplash.com/photo-1763998861638-c83bef652bd7?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-jardin-marina-01.jpg|https://images.unsplash.com/photo-1762539093556-21fd401de1b7?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-marina-essaouira-03.jpg|https://images.unsplash.com/photo-1727640567260-186316e0715a?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-centre-essaouira-01.jpg|https://images.unsplash.com/photo-1527854269107-68e2d1343e1d?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-vue-remparts-medina-02.jpg|https://images.unsplash.com/photo-1527776702328-f127392d764f?fm=jpg&q=80&w=1600&auto=format&fit=crop

location-gerance-cafe-corniche-02.jpg|https://images.unsplash.com/photo-1699533135549-6c62fb52a66c?fm=jpg&q=80&w=1600&auto=format&fit=crop
maison-de-ville-sidi-kaouki-02.jpg|https://images.unsplash.com/photo-1517227490102-2560e4f75702?fm=jpg&q=80&w=1600&auto=format&fit=crop
riad-terrasse-remparts-01.jpg|https://images.unsplash.com/photo-1699533135654-76d55bc2df48?fm=jpg&q=80&w=1600&auto=format&fit=crop

maison-ville-medina-terrasse-01.jpg|https://images.unsplash.com/photo-1727963177257-b580476faf81?fm=jpg&q=80&w=1600&auto=format&fit=crop
villa-golf-resort-sejour.jpeg|https://images.unsplash.com/photo-1699701915893-d6952e03ce39?fm=jpg&q=80&w=1600&auto=format&fit=crop

maison-jardin-campagne-essaouira-03.jpg|https://images.unsplash.com/photo-1761416182644-2d9d4f432563?fm=jpg&q=80&w=1600&auto=format&fit=crop
maison-terrasse-sidi-kaouki-sejour-03.jpg|https://images.unsplash.com/photo-1672753147005-9f56f4548216?fm=jpg&q=80&w=1600&auto=format&fit=crop

chambre-hotes-jardin-corniche-01.jpg|https://images.unsplash.com/photo-1675618102780-6d1f91d71056?fm=jpg&q=80&w=1600&auto=format&fit=crop
chambre-hotes-jardin-corniche-02.jpg|https://images.unsplash.com/photo-1699533137848-d6bce2dc4569?fm=jpg&q=80&w=1600&auto=format&fit=crop

appartement-jardin-marina-03.jpg|https://images.unsplash.com/photo-1753263432407-e29051c35e52?fm=jpg&q=80&w=1600&auto=format&fit=crop
appartement-marina-essaouira-02.jpg|https://images.unsplash.com/photo-1628642393776-70a715f2cc40?fm=jpg&q=80&w=1600&auto=format&fit=crop
EOF

echo "🎉 Images téléchargées dans $OUTPUT_DIR"