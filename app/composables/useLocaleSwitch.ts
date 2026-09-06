/** Switch between /us and /cn while preserving the current page path. */
export function useLocaleSwitch() {
  const route = useRoute()

  const localeLink = (targetLocale: 'en' | 'cn') => {
    const prefix = targetLocale === 'cn' ? '/cn' : '/us'
    const path = route.path

    if (path.startsWith('/cn')) {
      return prefix + (path.slice(3) || '')
    }
    if (path.startsWith('/us')) {
      return prefix + (path.slice(3) || '')
    }

    // Legacy unprefixed paths
    return prefix + (path === '/' ? '' : path)
  }

  return { localeLink }
}
