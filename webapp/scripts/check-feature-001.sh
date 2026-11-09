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
required_dirs=(
  "app"
  "app/assets"
  "app/components"
  "app/composables"
  "app/layouts"
  "app/middleware"
  "app/pages"
  "app/plugins"
  "app/stores"
  "app/utils"
  "content"
  "schemas"
  "services"
  "server"
  "shared"
  "public"
  "scripts"
)

blueprint_readmes=(
  "app/README.md"
  "app/assets/README.md"
  "app/components/README.md"
  "app/composables/README.md"
  "app/layouts/README.md"
  "app/middleware/README.md"
  "app/pages/README.md"
  "app/plugins/README.md"
  "app/stores/README.md"
  "app/utils/README.md"
  "content/README.md"
  "schemas/README.md"
  "services/README.md"
  "shared/README.md"
  "server/README.md"
  "public/README.md"
  "scripts/README.md"
)
required_files=(
  "app/assets/main.scss"
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

check_dirs_and_readmes

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
