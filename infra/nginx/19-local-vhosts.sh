#!/bin/sh
# Entrée Nginx locale : conserver les variables Nginx lors du rendu.
set -eu
case "${AIDE_LAYER:-}" in
  '') suffix=preprod ;;
  web|bff|domaine|devops) suffix="wt-${AIDE_LAYER}" ;;
  *) echo "Couche locale inconnue : ${AIDE_LAYER}" >&2; exit 1 ;;
esac
export SHOWCASE_HOST="showcase-immobilier.${suffix}.localhost"
export CLIENT2_HOST="client2.${suffix}.localhost"
# L’extension Compose active ce seul hôte ; aucun domaine fourni depuis le navigateur.
export DASHBOARD_HOST=''
export DASHBOARD_UPSTREAM=''
case "${DASHBOARD_ENABLED:-0}" in
  0) ;;
  1)
    DASHBOARD_HOST="dashboard.${suffix}.localhost"
    DASHBOARD_UPSTREAM="${DASHBOARD_HOST} dashboard-ssr:3000;"
    export DASHBOARD_HOST DASHBOARD_UPSTREAM ;;
  *) echo "Activation dashboard invalide" >&2; exit 1 ;;
esac
envsubst '${SHOWCASE_HOST} ${CLIENT2_HOST} ${DASHBOARD_HOST} ${DASHBOARD_UPSTREAM}' < /opt/local-vhost.conf > /etc/nginx/conf.d/default.conf
