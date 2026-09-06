/**
 * Resolve vue-i18n locale data to plain strings/objects.
 * `getLocaleMessage()` returns compiled AST nodes for string values — rendering them shows raw JSON.
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
  if (isMessageNode(value)) return resolveMessageText(value, rt)
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

function resolveMessageText(node: Record<string, unknown>, rt: (msg: unknown) => string): string {
  try {
    const resolved = rt(node)
    if (typeof resolved === 'string' && resolved && !resolved.startsWith('{')) {
      return resolved
    }
  } catch {
    // fall through to manual extraction
  }
  return extractStaticMessageText(node)
}

function extractStaticMessageText(node: Record<string, unknown>): string {
  if (typeof node.s === 'string') return node.s
  if (typeof node.source === 'string') return node.source

  if (Array.isArray(node.i)) {
    return node.i
      .map(item => (typeof item === 'object' && item !== null
        ? extractStaticMessageText(item as Record<string, unknown>)
        : ''))
      .join('')
  }

  const body = node.b ?? node.body
  if (typeof body === 'object' && body !== null) {
    return extractStaticMessageText(body as Record<string, unknown>)
  }

  return ''
}

function isMessageNode(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if ('type' in obj && ('source' in obj || 'body' in obj)) return true
  // Minified compiled AST: t=type, b=body, s=static, i=items
  if ('t' in obj && ('b' in obj || 's' in obj || 'i' in obj)) return true
  return false
}
