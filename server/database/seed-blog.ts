import { count } from 'drizzle-orm'
import type { DB } from './index'
import { schema } from './index'
import { importTailorBoostBlogPosts } from './import-tailorboost-blog'

type RawExec = (sql: string, params: unknown[]) => Promise<{ lastInsertRowid: number; rows: Record<string, unknown>[] }>

/** Seed TailorBoost blog posts from WordPress and about pages. */
export async function seedBlogPosts(db: DB, adminId: number | null, rawExec: RawExec) {
  const now = Date.now()

  await importTailorBoostBlogPosts(rawExec, adminId)

  // About page (en + cn)
  const aboutPages = [
    {
      title: 'About TailorBoost',
      slug: 'about',
      locale: 'en',
      excerpt: 'TailorBoost – Your Trusted Partner for International Expansion.',
      content: '# About TailorBoost\n\nTailorBoost is a professional SEO optimization and digital marketing agency with 15+ years of experience, serving hundreds of companies worldwide.',
    },
    {
      title: '关于',
      slug: 'about',
      locale: 'cn',
      excerpt: 'TailorBoost – 您值得信赖的出海增长伙伴。',
      content: '# 关于\n\nTailorBoost 是一家拥有 15+ 年经验的专业 SEO 优化与数字营销服务商，已为全球数百家企业提供服务。',
    },
  ]

  for (const p of aboutPages) {
    await rawExec(
      `INSERT OR IGNORE INTO cms_posts (title, slug, locale, excerpt, content, status, type, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.title, p.slug, p.locale, p.excerpt, p.content, 'published', 'page', adminId, now],
    )
  }
}

/** Seed blog posts from WordPress if DB has no posts. */
export async function ensureBlogPosts(db: DB) {
  const postRow = await db.select({ c: count() }).from(schema.posts).get()
  if ((postRow?.c ?? 0) > 0) return

  const admin = await db.select({ id: schema.users.id }).from(schema.users).limit(1).get()
  const adminId = admin?.id ?? null

  const { createClient } = await import('@libsql/client')
  const url = process.env.DATABASE_URL || `file:.data/${process.env.DATABASE_NAME || 'cms'}.sqlite`
  const raw = createClient({ url })

  async function rawExec(sql: string, params: unknown[]) {
    const result = await raw.execute({ sql, args: params as (string | number | null)[] })
    return { lastInsertRowid: Number(result.lastInsertRowid), rows: result.rows as Record<string, unknown>[] }
  }

  try {
    const { importTailorBoostBlogPosts } = await import('./import-tailorboost-blog')
    const count = await importTailorBoostBlogPosts(rawExec, adminId)
    console.info(`[seed-blog] Imported ${count} TailorBoost blog posts`)
  } finally {
    await raw.close()
  }
}
