/** Build locale-prefixed app paths: /us/* (en) or /cn/* (cn). */
export function useAppLocalePath() {
  const { locale } = useI18n()

  return (path: string | { path: string, hash?: string }) => {
    let routePath: string
    let hash = ''

    if (typeof path === 'object') {
      routePath = path.path
      hash = path.hash ? (path.hash.startsWith('#') ? path.hash : `#${path.hash}`) : ''
    }
    else {
      routePath = path
    }

    const prefix = locale.value === 'cn' ? '/cn' : '/us'
    const normalized = routePath === '/' ? '' : (routePath.startsWith('/') ? routePath : `/${routePath}`)
    return `${prefix}${normalized}${hash}`
  }
}
