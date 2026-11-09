import type { ApiError } from '#shared/types/echo'
import type { EchoResponse } from '#shared/types/echo'
import type { H3Event } from 'h3'

import { defineEventHandler, readBody, setResponseStatus } from 'h3'

import { echoRequestSchema } from '#shared/schemas'

const badRequest = (event: H3Event, details: unknown): ApiError => {
  setResponseStatus(event, 400)
  return { status: 400, message: 'Validation error', details }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  const parsed = echoRequestSchema.safeParse(body)

  if (!parsed.success) {
    return badRequest(event, parsed.error.flatten())
  }

  const response: EchoResponse = { echoed: parsed.data.message }
  return response
})
