import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '../../database'

const LOCALES = ['en', 'cn'] as const

/** Build locale-aware path (prefix_except_default: en has no prefix). */
function localePath(locale: string, path: string) {
  if (locale === 'en') return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

function hreflang(locale: string) {
  return locale === 'cn' ? 'zh-CN' : 'en-US'
}

function buildAlternates(pathByLocale: Record<string, string>) {
  return Object.entries(pathByLocale).map(([locale, href]) => ({
    hreflang: hreflang(locale),
    href,
  }))
}

/** TailorBoost sitemap URLs for @nuxtjs/sitemap. */
export default defineEventHandler(async (event) => {
  const staticRoutes = [
    { path: '/', priority: 1, changefreq: 'weekly' },
    { path: '/about', priority: 0.8, changefreq: 'monthly' },
    { path: '/blog', priority: 0.9, changefreq: 'daily' },
    { path: '/services', priority: 0.8, changefreq: 'monthly' },
    { path: '/cases', priority: 0.8, changefreq: 'monthly' },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' },
  ]

  type SitemapUrl = {
    loc: string
    lastmod?: string
    priority?: number
    changefreq?: string
    alternates?: { hreflang: string; href: string }[]
  }

  const urls: SitemapUrl[] = []

  for (const route of staticRoutes) {
    const pathByLocale = Object.fromEntries(
      LOCALES.map(l => [l, localePath(l, route.path === '/' ? '/' : route.path)]),
    ) as Record<string, string>

    for (const locale of LOCALES) {
      urls.push({
        loc: pathByLocale[locale],
        priority: route.priority,
        changefreq: route.changefreq,
        alternates: buildAlternates(pathByLocale),
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

      const lastmod = post.updatedAt ?? post.publishedAt
      urls.push({
        loc,
        lastmod: lastmod instanceof Date ? lastmod.toISOString() : undefined,
        priority: 0.7,
        changefreq: 'monthly',
        alternates: buildAlternates(pathByLocale),
      })
    }
  }
  catch {
    // DB unavailable during prerender — static URLs only
  }

  return urls
})
