import { join, resolve } from 'node:path'

import ViteYaml from '@modyfi/vite-plugin-yaml'

import { runSchemaHook } from './scripts/build/schema-hook'
import { FALLBACK_LOCALE, AVAILABLES_LOCALES } from './shared/utils/locale'

const appEnv = process.env.APP_ENV?.trim().toLowerCase() === 'prod' ? 'prod' : 'dev'
const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase()
const isDevRuntime = nodeEnv !== 'production'
const isScalarApiDocsEnabled = process.env.SCALAR_API_DOCS_ENABLED === 'true'
const nitroContentCacheMaxAge = isDevRuntime ? 0 : 300
const isStaticOutput = process.env.STATIC_OUTPUT === 'true'
const siteUrl = process.env.SITE_URL?.trim() || 'http://localhost:3000'
const symfonyApiUrl = process.env.SYMFONY_API_URL?.trim() ?? ''
const symfonyApiDocsUrl =
  process.env.SYMFONY_API_DOCS_URL?.trim() || 'http://localhost:18080/api/docs'

const nitroContentCacheHeaders =
  nitroContentCacheMaxAge > 0
    ? {
        'Cache-Control': `public, s-maxage=${nitroContentCacheMaxAge}, stale-while-revalidate=86400`,
      }
    : {}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  typescript: {
    strict: true,
  },

  ssr: true,

  css: ['~/assets/transitions.css', '~/assets/main.css'],

  app: {
    pageTransition: {
      name: 'zoom-in',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in',
    },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  ui: {
    fonts: false,
    colorMode: true,
  },

  fonts: {
    providers: {
      fontsource: false,
    },
  },

  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL ?? 'Showcase Immobilier <contact@example.com>',
    contactToEmail: process.env.CONTACT_TO_EMAIL ?? '',
    contactBccEmails: process.env.CONTACT_BCC_EMAILS ?? '',
    contactReplyToEmail: process.env.CONTACT_REPLY_TO_EMAIL ?? '',
    contactSubmissionsPath:
      process.env.CONTACT_SUBMISSIONS_PATH ??
      join(process.cwd(), '.data', 'contact-submissions.csv'),
    symfony: {
      apiUrl: symfonyApiUrl,
      apiDocsUrl: symfonyApiDocsUrl,
      projectId: process.env.SYMFONY_PROJECT_ID ?? '',
      serviceEmail: process.env.SYMFONY_SERVICE_EMAIL ?? '',
      servicePassword: process.env.SYMFONY_SERVICE_PASSWORD ?? '',
    },

    public: {
      appEnv,
      siteName: process.env.SITE_NAME?.trim() || 'Showcase Immobilier',
      siteUrl,
      isIndexable: appEnv === 'prod' && !isDevRuntime,
      webVitalsEnabled: process.env.WEB_VITALS_ENABLED === 'true',
      // Sortie statique : la page finale n'aura aucun serveur derriere elle.
      // Force le chargement serveur des donnees normalement differees au client,
      // et coupe ce qui suppose une API vivante (verification de version...).
      // Desactive par defaut ; active par la generation statique.
      staticOutput: isStaticOutput,
      // Variante de livrable : les panneaux normalement ouverts au clic sont
      // rendus deja ouverts, pour documenter cet etat dans la maquette.
      staticPanelsOpen: process.env.STATIC_PANELS_OPEN === 'true',
      // Variante de livrable : le menu principal est rendu deja ouvert.
      staticMenuOpen: process.env.STATIC_MENU_OPEN === 'true',
    },
  },

  sitemap: {
    // @ts-expect-error siteUrl is a valid but untyped option in this version
    siteUrl,
    autoLastmod: true,
    gzip: true,

    includeAppSources: true,

    sources: ['/api/__sitemap__/urls'],
  },

  nitro: {
    prerender: {
      // Les images transformees a la volee (`/_ipx/...`) sont decouvertes par le
      // parcours des liens, mais leur generation ne rend jamais la main : la
      // boucle de pre-rendu reste bloquee et la sortie finale n'est jamais
      // construite, le tout en annoncant un succes. Les exclure la debloque.
      ignore: [
        '/_ipx',
        // Espace prive, page de debogage et demos figees : hors livrable public.
        /^\/[a-z]{2}\/dashboard/,
        /^\/[a-z]{2}\/echo/,
        /^\/[a-z]{2}\/villa-des-alizes-content/,
        /^\/[a-z]{2}\/villa-des-alizes-mobile/,
      ],
      // Les images transformees a la volee (`/_ipx/...`) sont decouvertes par le
      // parcours des liens, mais leur generation ne rend jamais la main : la
      // boucle de pre-rendu reste bloquee et la sortie finale n'est jamais
      // construite (ni `_nuxt/`, ni images, ni polices), le tout en annoncant un
      // succes. Les exclure debloque `nuxt generate`.
      // Routes serveur transformees en fichiers : sans elles, la sortie statique
      // reclame un serveur qui n'existe plus (thème absent, page sans couleurs).
      routes: ['/themes.css', '/themes.json'],
    },
  },

  routeRules: {
    ...(isScalarApiDocsEnabled
      ? {
          '/api-docs/**': {
            ssr: false,
            headers: {
              'X-Robots-Tag': 'noindex, nofollow',
            },
          },
        }
      : {}),
    '/api/openapi': {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
    ...(nitroContentCacheMaxAge > 0
      ? {
          '/themes.json': {
            swr: nitroContentCacheMaxAge,
            headers: nitroContentCacheHeaders,
          },
          '/themes.css': {
            swr: nitroContentCacheMaxAge,
            headers: nitroContentCacheHeaders,
          },
        }
      : {}),
  },

  alias: {
    '@schemas': resolve(__dirname, 'schemas'),
    '@services': resolve(__dirname, 'services'),
    '@utils': resolve(__dirname, 'app/utils'),
    '@locales': resolve(__dirname, 'i18n/locales'),
    ...(process.env.DIGITAL_ORCHESTRATION_CORE_PATH?.trim()
      ? {
          '@DigitalOrchestrationCore': resolve(process.env.DIGITAL_ORCHESTRATION_CORE_PATH.trim()),
        }
      : {}),
  },

  icon: {
    // Les icones sont normalement dessinees par une feuille generee a la volee,
    // ou chargees depuis le reseau par script. En sortie statique, ni l'un ni
    // l'autre n'aboutit : on les rend directement en SVG dans la page.
    mode: 'svg',
    // Collections resolues depuis les paquets installes : sans declaration
    // explicite, une partie des icones n'est pas trouvee au rendu et sort vide.
    // Les icones issues du contenu (menu, coordonnees, cartes) ne sont pas
    // detectables dans le code source : sans declaration explicite, elles sont
    // cherchees sur le reseau au rendu et sortent vides du livrable statique.
    clientBundle: {
      scan: true,
      icons: [
        'lucide:bed-double',
        'lucide:building-2',
        'lucide:dot',
        'lucide:expand',
        'lucide:mail',
        'lucide:map-pin',
        'lucide:menu',
        'lucide:quote',
        'simple-icons:facebook',
        'simple-icons:instagram',
        'simple-icons:whatsapp',
        'heroicons:arrow-down',
        'heroicons:chevron-left',
        'heroicons:chevron-right',
        'heroicons:play-solid',
      ],
    },
  },

  image: {
    // En sortie statique, le transformateur d'images serveur (`/_ipx/...`) n'existe
    // plus. Sa variante `ipxStatic`, censee ecrire les images au build, bloque la
    // boucle de pre-rendu indefiniment sur ce projet. On sert donc les fichiers
    // d'origine : plus lourds, mais autonomes et fiables.
    provider: isStaticOutput ? 'none' : 'ipx',
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxtjs/device',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    'nuxt-auth-utils',
    'nuxt-tiptap-editor',
    ...(isScalarApiDocsEnabled ? ['@scalar/nuxt'] : []),
  ],

  scalar: {
    pathRouting: {
      basePath: '/api-docs',
    },
    url: '/api/openapi',
    metaData: {
      title: 'Showcase Immobilier API Documentation',
    },
  },

  tiptap: {
    prefix: 'Tiptap', //prefix for Tiptap imports, composables not included
  },

  mdc: {
    headings: {
      anchorLinks: {
        h1: false,
        h2: false,
        h3: false,
        h4: false,
        h5: false,
        h6: false,
      },
    },
  },

  i18n: {
    defaultLocale: FALLBACK_LOCALE,
    locales: Object.values(AVAILABLES_LOCALES).map((locale) => ({
      code: locale.code,
      language: locale.iso,
      name: locale.name,
      dir: locale.dir,
    })),
    strategy: 'prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    pages: {
      'properties/[realEstateListing]/index': {
        fr: '/biens/[realEstateListing]',
        en: '/properties/[realEstateListing]',
        es: '/propiedades/[realEstateListing]',
      },
    },
  },

  hooks: {
    'build:before': runSchemaHook,
  },

  build: {
    analyze: {
      template: 'treemap',
      filename: '.nuxt/analyze/report.html',
    },
  },

  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return

            if (id.includes('/vue-i18n/') || id.includes('/@intlify/')) {
              return 'vendor-i18n'
            }

            if (id.includes('/@vueuse/')) {
              return 'vendor-vueuse'
            }

            if (id.includes('/gsap/')) {
              return 'vendor-gsap'
            }

            if (id.includes('/embla-carousel')) {
              return 'vendor-embla'
            }
          },
        },
      },
    },
    plugins: [ViteYaml(), (await import('vite-svg-loader')).default()],
    optimizeDeps: {
      include: ['@tiptap/markdown', '@tiptap/extension-table', 'markdown-it'],
    },
  },
})
