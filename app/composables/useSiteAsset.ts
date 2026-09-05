/** Local theme/marketing image paths (served from public/images/). */
export function useThemeImage() {
  const img = (name: string) => `/images/${name}`
  return { img }
}

/**
 * Resolve site asset URL for images under public/images or public/uploads.
 * Dev + CF Pages static: direct path. Production R2 fallback via /api/media/.
 */
export function useSiteAsset() {
  const config = useRuntimeConfig()
  const useR2 = Boolean(config.public.useR2Media)

  function asset(publicPath: string) {
    if (!publicPath) return publicPath
    if (publicPath.startsWith('http')) return publicPath
    if (!publicPath.startsWith('/')) publicPath = `/${publicPath}`

    // Local dev and static deploy: Nuxt serves public/ directly
    if (import.meta.dev || !useR2) return publicPath

    // Production with R2: map to /api/media/ keys
    if (publicPath.startsWith('/images/')) {
      return `/api/media/static${publicPath}`
    }
    if (publicPath.startsWith('/uploads/')) {
      return `/api/media${publicPath}`
    }
    return publicPath
  }

  const { img } = useThemeImage()
  const themeImg = (name: string) => asset(img(name))

  return { asset, themeImg, img: themeImg }
}
