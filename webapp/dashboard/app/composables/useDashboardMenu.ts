export const useDashboardMenu = () => {
  const { t } = useI18n()
  const groups = [
    { label: t('menu.content'), items: ['pages', 'articles', 'stays', 'landing', 'components'] },
    { label: t('menu.media'), items: ['images', 'videos', 'documents', 'icons'] },
    { label: t('menu.forms'), items: ['contact', 'product'] },
    { label: t('menu.commerce'), items: ['people', 'orders', 'promos', 'prices'] },
    { label: t('menu.administration'), items: ['administrators', 'organization', 'social'] },
  ].map((group) => ({
    label: group.label,
    items: group.items.map((key) => ({
      label: t(`menu.${key}`),
      to: ['administrators', 'organization'].includes(key) ? '/administration' : undefined,
      available: ['administrators', 'organization'].includes(key),
    })),
  }))
  return { groups }
}
