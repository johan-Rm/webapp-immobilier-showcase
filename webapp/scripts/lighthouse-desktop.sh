#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:3001/fr}"
OUT="${2:-./lighthouse.desktop.provided.json}"
PORT="${LH_PORT:-9333}"
PROFILE_DIR="$(mktemp -d /tmp/chrome-lh.XXXXXX)"

if ! command -v jq >/dev/null 2>&1; then
  echo "Erreur: 'jq' est requis."
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Erreur: 'npx' est requis."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Erreur: 'curl' est requis."
  exit 1
fi

CHROME_PATH="${CHROME_PATH:-$(find "$HOME/.cache/ms-playwright" -type f -path '*/chrome-linux64/chrome' | head -n1)}"

if [[ -z "${CHROME_PATH}" || ! -x "${CHROME_PATH}" ]]; then
  echo "Chrome introuvable dans ~/.cache/ms-playwright."
  echo "Installe-le avec: npx -y playwright install chromium"
  exit 1
fi

cleanup() {
  if [[ -n "${CHROME_PID:-}" ]]; then
    kill "${CHROME_PID}" >/dev/null 2>&1 || true
  fi
  rm -rf "${PROFILE_DIR}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup_invalid_report() {
  if [[ -f "${OUT}" ]]; then
    rm -f "${OUT}" >/dev/null 2>&1 || true
  fi
}

validate_report() {
  local runtime_error_code
  local final_displayed_url

  runtime_error_code="$(jq -r '.runtimeError.code // empty' "${OUT}")"
  final_displayed_url="$(jq -r '.finalDisplayedUrl // .finalUrl // empty' "${OUT}")"

  if [[ "${runtime_error_code}" == "CHROME_INTERSTITIAL_ERROR" ]]; then
    cleanup_invalid_report
    echo "Erreur: Lighthouse a rencontre un interstitial Chrome pour ${URL}"
    echo "Verifie l'URL cible et que le SSR local repond bien avant de relancer."
    exit 1
  fi

  if [[ "${final_displayed_url}" == chrome-error://chromewebdata/* ]]; then
    cleanup_invalid_report
    echo "Erreur: Chrome a charge une page d'erreur a la place de ${URL}"
    echo "URL finale observee: ${final_displayed_url}"
    exit 1
  fi
}

if ! curl --silent --show-error --fail --location --max-time 10 --output /dev/null "${URL}"; then
  echo "Erreur: URL cible inaccessible: ${URL}"
  echo "Verifie que le SSR local est demarre, par exemple :"
  echo "  WEB_VITALS_ENABLED=false make dev-webapp-ssr BUILD=1"
  exit 1
fi

pkill -f "remote-debugging-port=${PORT}" >/dev/null 2>&1 || true

"${CHROME_PATH}" \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --remote-debugging-port="${PORT}" \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir="${PROFILE_DIR}" \
  about:blank >/tmp/chrome-lh.log 2>&1 &
CHROME_PID=$!

sleep 2

if ! npx lighthouse "${URL}" \
  --preset=desktop \
  --throttling-method=provided \
  --port="${PORT}" \
  --output=json \
  --output-path="${OUT}"; then
  if [[ -f "${OUT}" ]]; then
    validate_report
    cleanup_invalid_report
  fi
  echo "Erreur: Lighthouse a echoue pour ${URL}"
  exit 1
fi

validate_report

score_color() {
  local score="$1"
  if (( score >= 90 )); then
    printf '\033[32m'
  elif (( score >= 50 )); then
    printf '\033[33m'
  else
    printf '\033[31m'
  fi
}

score_perf="$(jq -r '(.categories.performance.score * 100) | round' "${OUT}")"
score_a11y="$(jq -r '(.categories.accessibility.score * 100) | round' "${OUT}")"
score_bp="$(jq -r '(.categories["best-practices"].score * 100) | round' "${OUT}")"
score_seo="$(jq -r '(.categories.seo.score * 100) | round' "${OUT}")"

printf '\n'
printf 'Lighthouse report: %s\n' "${OUT}"
printf 'URL: %s\n' "${URL}"
printf '\n'

printf 'Performance:    %b%3s\033[0m\n' "$(score_color "${score_perf}")" "${score_perf}"
printf 'Accessibility:  %b%3s\033[0m\n' "$(score_color "${score_a11y}")" "${score_a11y}"
printf 'Best Practices: %b%3s\033[0m\n' "$(score_color "${score_bp}")" "${score_bp}"
printf 'SEO:            %b%3s\033[0m\n' "$(score_color "${score_seo}")" "${score_seo}"
