import { z } from 'zod'

export const echoRequestSchema = z.object({
  message: z.string().trim().min(1).max(200),
})

export const echoResponseSchema = z.object({
  echoed: z.string(),
})
