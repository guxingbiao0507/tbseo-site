import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '../../database'

const LOCALES = ['en', 'cn'] as const

/** Static pages lastmod — update when marketing pages change materially. */
const STATIC_LASTMOD = '2026-09-05T00:00:00.000Z'

function localePath(locale: string, path: string) {
  if (locale === 'en') return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

function hreflang(locale: string) {
  return locale === 'cn' ? 'zh-CN' : 'en-US'
}

function absUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).href
}

function buildAlternates(siteUrl: string, pathByLocale: Record<string, string>) {
  return Object.entries(pathByLocale).map(([locale, path]) => ({
    hreflang: hreflang(locale),
    href: absUrl(siteUrl, path),
  }))
}

function formatLastmod(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return undefined
}

/** TailorBoost sitemap URLs for @nuxtjs/sitemap (en + cn sitemaps). */
export default defineSitemapEventHandler(async (event) => {
  const siteUrl = useSiteConfig(event).url || 'https://tailorboost.com'

  const staticRoutes = [
    { path: '/', priority: 1, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/blog', priority: 0.9, changefreq: 'daily' as const },
    { path: '/services', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/cases', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' as const },
  ]

  type SitemapEntry = {
    loc: string
    lastmod?: string
    priority?: number
    changefreq?: string
    alternates?: { hreflang: string; href: string }[]
    _sitemap?: string
  }

  const urls: SitemapEntry[] = []

  for (const route of staticRoutes) {
    const pathByLocale = Object.fromEntries(
      LOCALES.map(l => [l, localePath(l, route.path === '/' ? '/' : route.path)]),
    ) as Record<string, string>

    for (const locale of LOCALES) {
      urls.push({
        loc: pathByLocale[locale],
        lastmod: STATIC_LASTMOD,
        priority: route.priority,
        changefreq: route.changefreq,
        alternates: buildAlternates(siteUrl, pathByLocale),
        _sitemap: locale,
      })
    }
  }

  try {
    const db = useDb(event)
    const posts = await db
      .select({
        slug: schema.posts.slug,
        locale: schema.posts.locale,
        updatedAt: schema.posts.updatedAt,
        publishedAt: schema.posts.publishedAt,
      })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, 'published'), eq(schema.posts.type, 'post')))
      .all()

    const pathsBySlug = new Map<string, Record<string, string>>()
    for (const post of posts) {
      if (!LOCALES.includes(post.locale as typeof LOCALES[number])) continue
      const blogPath = `/blog/${post.slug}`
      const paths = pathsBySlug.get(post.slug) ?? {}
      paths[post.locale] = localePath(post.locale, blogPath)
      pathsBySlug.set(post.slug, paths)
    }

    for (const post of posts) {
      if (!LOCALES.includes(post.locale as typeof LOCALES[number])) continue

      const blogPath = `/blog/${post.slug}`
      const loc = localePath(post.locale, blogPath)
      const pathByLocale = pathsBySlug.get(post.slug) ?? { [post.locale]: loc }
      const alternates = buildAlternates(siteUrl, pathByLocale)

      urls.push({
        loc,
        lastmod: formatLastmod(post.updatedAt ?? post.publishedAt),
        priority: 0.7,
        changefreq: 'monthly',
        alternates: alternates.length > 0 ? alternates : undefined,
        _sitemap: post.locale,
      })
    }
  }
  catch {
    // D1 unavailable — static URLs only
  }

  return urls
})
