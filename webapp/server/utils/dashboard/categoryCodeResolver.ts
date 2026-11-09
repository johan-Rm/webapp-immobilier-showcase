import type {
  DashboardAccommodationResolvedCategoryCodes,
  DashboardEditableRecord,
  DashboardEditableValue,
} from '#shared/types/dashboardAccommodation'

const getStringArray = (value: DashboardEditableValue | undefined): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const getString = (value: DashboardEditableValue | undefined): string | null =>
  typeof value === 'string' && value ? value : null

export const resolveCategoryCodes = (input: {
  locale: string
  frontmatter: DashboardEditableRecord
  apiUrl: string
  projectId: string
}): DashboardAccommodationResolvedCategoryCodes => {
  const resolve = (codeValue: string | null): string | null => codeValue
  const resolveMany = (codeValues: string[]): string[] => codeValues

  return {
    category: resolve(getString(input.frontmatter.category)),
    realEstateListing: resolve(getString(input.frontmatter.realEstateListing)),
    place: resolve(getString(input.frontmatter.place)),
    amenityFeature: resolveMany(getStringArray(input.frontmatter.amenityFeature)),
    tags: resolveMany(getStringArray(input.frontmatter.tags)),
  }
}
