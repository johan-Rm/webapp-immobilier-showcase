export type OrganizationPhoneEntry = {
  label: string
  phone: string
  href: string
}

const PHONE_LABELS = ['FRANCE', 'MAROC'] as const

const normalizePhoneHref = (phone: string): string => phone.replace(/[^\d+]/g, '')

export const getOrganizationPhoneEntries = (phoneNumbers: string[]): OrganizationPhoneEntry[] => {
  return phoneNumbers
    .filter((phone) => phone.trim().length > 0)
    .map((phone, index) => ({
      label: PHONE_LABELS[index] ?? `Telephone ${index + 1}`,
      phone,
      href: `tel:${normalizePhoneHref(phone)}`,
    }))
}
