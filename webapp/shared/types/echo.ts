import type { echoRequestSchema, echoResponseSchema } from '../schemas'
import type { z } from 'zod'

export type EchoRequest = z.infer<typeof echoRequestSchema>
export type EchoResponse = z.infer<typeof echoResponseSchema>

export type ApiError = {
  status: number
  message: string
  details?: unknown
}

export type JsonFetcher = <T = unknown>(
  request: string,
  options: { method: 'POST'; body: Record<string, unknown> | BodyInit | null | undefined },
) => Promise<T>
