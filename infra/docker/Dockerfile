# syntax=docker/dockerfile:1.4
# Contexte de build : webapp/ (défini dans les fichiers Compose).
# Dockerfile (production-like SSR)

FROM oven/bun:1.4.0-alpine AS build

ARG GD_TARGET=showcase-immobilier
ARG APP_ENV=prod
ARG SITE_URL=https://example.com
ARG SITE_NAME="Mon Webapp"
ARG WEB_VITALS_ENABLED=false
ARG NODE_BUILD_MEMORY_MB=4096

RUN apk add --no-cache bash git curl python3 make g++ nodejs \
    && git config --global --add safe.directory /app

WORKDIR /app

ENV NODE_ENV=production
ENV GD_TARGET=${GD_TARGET}
ENV APP_ENV=${APP_ENV}
ENV SITE_URL=${SITE_URL}
ENV SITE_NAME=${SITE_NAME}
ENV WEB_VITALS_ENABLED=${WEB_VITALS_ENABLED}
ENV NODE_OPTIONS=--max-old-space-size=${NODE_BUILD_MEMORY_MB}
ENV SCHEMAS_PATH=/opt/app-schemas
ENV NITRO_PRESET=node-server
ENV PUBLIC_HOST=localhost
ENV PUBLIC_PORT=3001

COPY package.json \
    bun.lock ./

RUN bun install --frozen-lockfile

COPY . ./

COPY --from=schemas . /opt/app-schemas/

RUN if [ "$GD_TARGET" = "showcase-immobilier" ]; then \
      test -f /opt/app-schemas/dtos/symfony_api/accommodation.yaml \
      && test -f /opt/app-schemas/dtos/symfony_api/web_page.yaml \
      && test -d /opt/app-schemas/webapp; \
    fi

RUN node ./node_modules/nuxt/bin/nuxt.mjs build


# Runtime minimal : le preset Nitro node-server produit un .output autonome,
# seul Node est requis pour l'exécuter. La sync de contenu tourne dans un
# service compose dédié (oven/bun), pas ici.
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV WEB_VITALS_ENABLED=false
ENV SCHEMAS_PATH=/opt/app-schemas
ENV PUBLIC_HOST=localhost
ENV PUBLIC_PORT=3001

COPY --from=build /app/.output ./.output
COPY --from=build /opt/app-schemas /opt/app-schemas
COPY --from=build /app/scripts/entrypoint-ssr.sh /entrypoint-ssr.sh

RUN chmod +x /entrypoint-ssr.sh

EXPOSE 3000

CMD ["/entrypoint-ssr.sh"]
