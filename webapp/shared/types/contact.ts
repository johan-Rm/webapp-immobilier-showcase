export type ContactPayload = {
  firstName: string
  lastName?: string
  email: string
  phone?: string
  message: string
  website?: string
  propertyReference?: string
}

export type ContactResponse = {
  success: boolean
  confirmationSent?: boolean
}
