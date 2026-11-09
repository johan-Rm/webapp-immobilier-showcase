import type { MenuItem } from './content'
import type { ProjectLocalesConfig } from './i18n'

export type AppNavigationItem = Omit<MenuItem, 'identifier'> & {
  name: string
  url: string
}

export type AppNavigation = Record<string, AppNavigationItem>

export type AppMenu = {
  primaryMenuItems: string[]
  secondaryMenuItems: string[]
  otherItems?: string[]
}

export type AppOrganization = {
  acronym: string
  fullName: string
  alternateName: string
  location?: string
  image?: string
  email: string[]
  phoneNumbers: string[]
}

export type AppLinkTarget = '_blank' | '_self' | '_parent' | '_top'

export type AppFooterLink = {
  label: string
  to: string
}

export type AppFooterSocialLink = {
  order?: number
  tone?: 'default' | 'whatsapp'
  icon: string
  to: string
  target?: AppLinkTarget
  'aria-label': string
}

export type AppFooterLinkGroup = {
  label: string
  links: AppFooterLink[]
}

export type AppFooterNavigationLinkGroup = {
  label: string
  menu: string
}

export type AppFooter = {
  credits: string
  showColorModeToggle?: boolean
  socialLinks: AppFooterSocialLink[]
  accommodationTypes: AppFooterNavigationLinkGroup
  services: AppFooterNavigationLinkGroup
  meta: AppFooterNavigationLinkGroup
}

export type AppNavigationMainComponent = {
  closeMenuAriaLabel: string
  stayConnectedTitle: string
  contactDetailsTitle: string
  mainMenuAriaLabel: string
}

export type AppLogoComponent = {
  ariaLabel: string
}

export type AppSocialNetworkComponent = {
  navAriaLabel: string
  openMenuAriaLabel: string
  closeMenuAriaLabel: string
}

export type AppLangSwitcherComponent = {
  navAriaLabel: string
}

export type AppComponents = {
  logo?: AppLogoComponent
  navigationMain?: AppNavigationMainComponent
  socialNetwork?: AppSocialNetworkComponent
  langSwitcher?: AppLangSwitcherComponent
}

export type AppAccommodationLabels = {
  bathrooms: string
  bedrooms: string
  garages: string
  price: string
  propertyReference: string
  propertyStatus: string
  propertyType: string
  rooms: string
  surface: string
  surfaceHabitable: string
  surfaceTerrain: string
}

export type AppAccommodationSections = {
  details: string
  detailsSummary: string
  location: string
  review: string
  visitGuide: string
  wellness: string
}

export type AppAccommodationTexts = {
  noImageAvailable: string
  propertyVisual: string
  requestVisit: string
}

export type AppAccommodation = {
  labels: AppAccommodationLabels
  sections: AppAccommodationSections
  texts: AppAccommodationTexts
}

export type App = {
  i18n?: ProjectLocalesConfig
  components?: AppComponents
  footer?: AppFooter
  navigation: AppNavigation
}
