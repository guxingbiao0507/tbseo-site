import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '../database'

const LOCALES = ['en', 'cn'] as const
type Locale = typeof LOCALES[number]

/** Static pages lastmod — update when marketing pages change materially. */
const STATIC_LASTMOD = '2026-09-05T00:00:00.000Z'

function siteUrl() {
  return process.env.NUXT_PUBLIC_SITE_URL || 'https://tailorboost.com'
}

function localePath(locale: string, path: string) {
  const suffix = path === '/' ? '' : path
  if (locale === 'en') return `/us${suffix}`
  return `/cn${suffix}`
}

function hreflang(locale: string) {
  return locale === 'cn' ? 'zh-CN' : 'en-US'
}

function absUrl(base: string, path: string) {
  return new URL(path, base).href
}

function buildAlternates(base: string, pathByLocale: Record<string, string>) {
  return Object.entries(pathByLocale).map(([locale, path]) => ({
    hreflang: hreflang(locale),
    href: absUrl(base, path),
  }))
}

function formatLastmod(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return undefined
}

export type SitemapEntry = {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
  alternates?: { hreflang: string; href: string }[]
}

/** Build sitemap URL entries for @nuxtjs/sitemap sources. */
export async function buildSitemapUrls(
  event: H3Event,
  locale?: Locale,
): Promise<SitemapEntry[]> {
  const base = siteUrl()
  const staticRoutes = [
    { path: '/', priority: 1, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/blog', priority: 0.9, changefreq: 'daily' as const },
    { path: '/services', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/cases', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' as const },
  ]

  const urls: SitemapEntry[] = []
  const targetLocales = locale ? [locale] : LOCALES

  for (const route of staticRoutes) {
    const pathByLocale = Object.fromEntries(
      LOCALES.map(l => [l, localePath(l, route.path === '/' ? '/' : route.path)]),
    ) as Record<string, string>

    for (const locLocale of targetLocales) {
      urls.push({
        loc: pathByLocale[locLocale],
        lastmod: STATIC_LASTMOD,
        priority: route.priority,
        changefreq: route.changefreq,
        alternates: buildAlternates(base, pathByLocale),
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

    const pathsBySlug = new Map<string, Record<string, string>>()
    for (const post of posts) {
      if (!LOCALES.includes(post.locale as Locale)) continue
      const blogPath = `/blog/${post.slug}`
      const paths = pathsBySlug.get(post.slug) ?? {}
      paths[post.locale] = localePath(post.locale, blogPath)
      pathsBySlug.set(post.slug, paths)
    }

    for (const post of posts) {
      if (!LOCALES.includes(post.locale as Locale)) continue
      if (locale && post.locale !== locale) continue

      const blogPath = `/blog/${post.slug}`
      const loc = localePath(post.locale, blogPath)
      const pathByLocale = pathsBySlug.get(post.slug) ?? { [post.locale]: loc }
      const alternates = buildAlternates(base, pathByLocale)

      urls.push({
        loc,
        lastmod: formatLastmod(post.updatedAt ?? post.publishedAt),
        priority: 0.7,
        changefreq: 'monthly',
        alternates: alternates.length > 0 ? alternates : undefined,
      })
    }
  }
  catch (err) {
    console.warn('[sitemap] DB unavailable, static URLs only:', err)
  }

  return urls
}
