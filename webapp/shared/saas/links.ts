/** Allowed editorial links; reject browser-normalized control characters and network paths. */
export const isEditorialLink = (value: string): boolean => {
  if (!value || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return false
  if (value.startsWith('#')) return true
  if (value.startsWith('/') && !value.startsWith('//')) return true
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(value)) {
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol)
        ? Boolean(url.hostname) && !url.username && !url.password
        : Boolean(url.pathname)
    } catch {
      return false
    }
  }
  return /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:[?#][^\s]*)?$/i.test(value)
}
