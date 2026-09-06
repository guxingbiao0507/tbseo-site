import enMessages from '../../i18n/locales/en.json'
import cnMessages from '../../i18n/locales/cn.json'

/** Sync i18n locale from URL prefix (/us → en, /cn → cn). */
export const useUrlLocale = () => {
  const { locale, setLocaleMessage } = useI18n()
  const route = useRoute()

  const path = route.path
  const localeMap: Record<string, string> = {
    '/us': 'en',
    '/cn': 'cn',
  }

  for (const [prefix, loc] of Object.entries(localeMap)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      if (locale.value !== loc) {
        setLocaleMessage(loc, loc === 'cn' ? cnMessages : enMessages)
        locale.value = loc
      }
      break
    }
  }
}
