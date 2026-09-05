import enMessages from '../../i18n/locales/en.json'
import cnMessages from '../../i18n/locales/cn.json'

export const useUrlLocale = () => {
  const { locale, setLocaleMessage } = useI18n()
  const route = useRoute()

  const path = route.path
  const localeMap: Record<string, string> = {
    '/cn': 'cn',
    '/en': 'en',
  }

  for (const [prefix, loc] of Object.entries(localeMap)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      if (locale.value !== loc) {
        const messages: Record<string, object> = { en: enMessages, cn: cnMessages }
        const msg = messages[loc]
        if (msg) setLocaleMessage(loc, msg)
        locale.value = loc
      }
      break
    }
  }
}
