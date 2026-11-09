import { createError, defineEventHandler, setHeader } from 'h3'

const OPENAPI_ACCEPT_HEADER = 'application/vnd.openapi+json'

export default defineEventHandler(async (event): Promise<unknown> => {
  const { apiDocsUrl } = useRuntimeConfig().symfony

  if (!apiDocsUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SYMFONY_API_DOCS_URL manquant',
    })
  }

  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')

  try {
    return await $fetch<unknown>(apiDocsUrl, {
      headers: {
        Accept: OPENAPI_ACCEPT_HEADER,
      },
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Documentation OpenAPI Symfony indisponible',
    })
  }
})
