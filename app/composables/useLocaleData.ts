/**
 * Resolve vue-i18n locale data to plain strings/objects.
 * `tm()` returns compiled AST nodes for string values — rendering them shows raw JSON.
 */
export function useResolveLocale() {
  const { locale, getLocaleMessage, rt } = useI18n()

  const resolvePath = <T>(path: string): T | undefined => {
    const keys = path.split('.')
    let value: unknown = getLocaleMessage(locale.value)
    for (const key of keys) {
      if (value == null || typeof value !== 'object') return undefined
      value = (value as Record<string, unknown>)[key]
    }
    return resolveLocaleValue(value, rt) as T
  }

  return { resolvePath }
}

function resolveLocaleValue(value: unknown, rt: (msg: unknown) => string): unknown {
  if (value == null) return value
  if (typeof value === 'string') return value
  if (isMessageNode(value)) return rt(value)
  if (Array.isArray(value)) {
    return value.map(item => resolveLocaleValue(item, rt))
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolveLocaleValue(v, rt)]),
    )
  }
  return String(value)
}

function isMessageNode(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && 'type' in value
    && ('source' in value || 'body' in value)
}
