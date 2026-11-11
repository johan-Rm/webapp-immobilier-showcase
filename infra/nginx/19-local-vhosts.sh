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
envsubst '${SHOWCASE_HOST} ${CLIENT2_HOST}' < /opt/local-vhost.conf > /etc/nginx/conf.d/default.conf
