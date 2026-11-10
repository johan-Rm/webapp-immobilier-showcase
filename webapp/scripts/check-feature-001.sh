#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

info() { printf "ℹ️  %s\n" "$*"; }
ok() { printf "✅ %s\n" "$*"; }
fail() { printf "❌ %s\n" "$*"; }

status=0

# Charger BLUEPRINTS_PATH depuis .env si disponible
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

info "Validation FEAT-001 (CA1-CA7)"
info "CA1: Artefacts Bun/Nuxt"
info "CA2: Dépendances requises"
info "CA3/CA4: Arborescence + READMEs copiés"
info "CA5/CA6: Fichiers blueprint"
info "CA7: TypeScript strict"

# CA3/CA4 : arborescence et symlinks
site_id="${GD_TARGET:-showcase-immobilier}"
[[ "$site_id" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || exit 1
site_app="sites/$site_id/app"

required_dirs=(
  "$site_app"
  "$site_app/assets"
  "$site_app/components"
  "$site_app/composables"
  "$site_app/layouts"
  "$site_app/middleware"
  "$site_app/pages"
  "$site_app/plugins"
  "$site_app/stores"
  "$site_app/utils"
  "content"
  "schemas"
  "services"
  "server"
  "shared"
  "public"
  "scripts"
)

blueprint_readmes=(
  "$site_app/README.md"
  "$site_app/assets/README.md"
  "$site_app/components/README.md"
  "$site_app/composables/README.md"
  "$site_app/layouts/README.md"
  "$site_app/middleware/README.md"
  "$site_app/pages/README.md"
  "$site_app/plugins/README.md"
  "$site_app/stores/README.md"
  "$site_app/utils/README.md"
  "content/README.md"
  "schemas/README.md"
  "services/README.md"
  "shared/README.md"
  "server/README.md"
  "public/README.md"
  "scripts/README.md"
)
required_files=(
  "$site_app/assets/main.css"
)

check_dirs_and_readmes() {
  local missing=0
  for dir in "${required_dirs[@]}"; do
    if [[ ! -d "$dir" ]]; then
      fail "Manque dossier: $dir"
      missing=1
    fi
  done

  for file in "${blueprint_readmes[@]}"; do
    if [[ ! -e "$file" ]]; then
      fail "README blueprint manquant (copie attendue): $file"
      missing=1
      continue
    fi
    if [[ -L "$file" ]]; then
      fail "README blueprint ne doit pas être un symlink: $file"
      missing=1
      continue
    fi
    if ! head -n 1 "$file" | grep -q '^> Source: .*directory-structure'; then
      fail "README blueprint sans mention de provenance: $file"
      missing=1
    fi
  done

  for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
      fail "Manque fichier requis: $file"
      missing=1
    fi
  done

  if [[ $missing -eq 0 ]]; then
    ok "CA3/CA4: arborescence et READMEs copiés conformes"
  else
    status=1
  fi
}

# CA1 : présence bun.lock et dépendance nuxt
if [[ -f "bun.lock" ]] && grep -q '"nuxt"' package.json; then
  ok "CA1: bun.lock présent et dépendance nuxt détectée"
else
  fail "CA1: bun.lock ou dépendance nuxt manquants"
  status=1
fi

# CA2 : modules requis installés
if bun -e "const pkg=(await import('./package.json',{assert:{type:'json'}})).default;const all=new Set([...Object.keys(pkg.dependencies||{}),...Object.keys(pkg.devDependencies||{})]);const req=['pinia','nuxt','@pinia/nuxt','@modyfi/vite-plugin-yaml','tailwindcss','autoprefixer','@nuxt/hints','@nuxt/image','@nuxt/icon','@nuxt/ui','@nuxt/content','@nuxtjs/i18n','@nuxtjs/sitemap'];const missing=req.filter(d=>!all.has(d));if(missing.length){console.error('CA2: KO -> manquants :',missing.join(', '));process.exit(1);}"; then
  ok "CA2: dépendances requises présentes"
else
  status=1
fi

if [[ "$site_id" == "showcase-immobilier" ]]; then
  check_dirs_and_readmes
else
  for file in "sites/$site_id/nuxt.config.ts" "sites/$site_id/site.ts" "$site_app/app.vue" "$site_app/pages/index.vue"; do
    [[ -f "$file" ]] || { fail "Manque fichier requis: $file"; status=1; }
  done
fi

# CA5/CA6 : fichiers blueprint présents et alignés
compare_file() {
  local src="$1"
  local dst="$2"
  local label="${3:-Aligné avec blueprint: $dst}"
  if [[ ! -f "$dst" ]]; then
    fail "$label (manquant: $dst)"
    status=1
    return
  fi
  if cmp -s "$src" "$dst"; then
    ok "$label"
  else
    fail "$label (différent du blueprint)"
    status=1
  fi
}

if [[ -z "${BLUEPRINTS_PATH:-}" ]]; then
  fail "BLUEPRINTS_PATH non défini (attendu dans .env) pour comparer les fichiers blueprint"
  status=1
else
  compare_file "$BLUEPRINTS_PATH/.gitignore" ".gitignore" "CA5: Aligné avec blueprint: .gitignore"
  compare_file "$BLUEPRINTS_PATH/tsconfig.json" "tsconfig.json" "CA6: Aligné avec blueprint: tsconfig.json"
  compare_file "$BLUEPRINTS_PATH/.env.example" ".env.example" "CA6: Aligné avec blueprint: .env.example"
  # Pour tailwind/postcss (convertis en TS), on vérifie la présence minimale.
  if [[ -f "tailwind.config.ts" ]]; then
    ok "CA6: Présence tailwind.config.ts (adapté depuis blueprint)"
  else
    fail "CA6: tailwind.config.ts manquant"
    status=1
  fi
  if [[ -f "postcss.config.ts" ]]; then
    ok "CA6: Présence postcss.config.ts (adapté depuis blueprint)"
  else
    fail "CA6: postcss.config.ts manquant"
    status=1
  fi
fi

# CA7 : TypeScript strict dans nuxt.config.ts (via Bun)
if bun -e "import { readFileSync } from 'node:fs'; const src=readFileSync('nuxt.config.ts','utf8'); if(!src.includes('strict: true')){console.error('CA7: KO strict: true manquant'); process.exit(1);}"; then
  ok "CA7: TypeScript strict activé"
else
  fail "CA7: TypeScript strict non détecté"
  status=1
fi

if [[ $status -eq 0 ]]; then
  ok "FEAT-001: CA1-CA7 validés"
else
  fail "FEAT-001: certains critères ont échoué"
fi

exit "$status"
