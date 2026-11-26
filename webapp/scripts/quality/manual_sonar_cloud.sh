#!/usr/bin/env bash
# Prépare le scanner officiel pour la cible Make SonarQube locale.
set -eu
umask 077

for binary in curl unzip sha256sum bwrap socat python3 git; do
  command -v "$binary" >/dev/null || { printf 'Prérequis absent : %s\n' "$binary" >&2; exit 1; }
done

python3 -B webapp/scripts/quality/sonar_run.py --check-config

scanner_temp="$(mktemp -d "${TMPDIR:-/tmp}/sonar-cli.XXXXXXXX")"
trap 'rm -rf -- "$scanner_temp"' EXIT
archive="$scanner_temp/scanner.zip"
version='8.4.0.16527'
checksum='2a28f118e2e9375dfd36eb27b803e1d37f93daba4db068aca6eef9853041bb24'
printf '%s\n' "SonarQube : téléchargement du scanner officiel."
curl --fail --silent --show-error --location \
  "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${version}-linux-x64.zip" \
  --output "$archive"
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check
unzip -q "$archive" -d "$scanner_temp"
SONAR_SCANNER_HOME="$scanner_temp/sonar-scanner-${version}-linux-x64" python3 -B webapp/scripts/quality/sonar_run.py
