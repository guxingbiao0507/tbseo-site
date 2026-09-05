type RawExec = (sql: string, params: unknown[]) => Promise<{ lastInsertRowid: number; rows: Record<string, unknown>[] }>

interface WpPost {
  slug: string
  date: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
}

const WP_BASES: Record<string, string> = {
  en: 'https://tailorboost.com/us/wp-json/wp/v2/posts',
  cn: 'https://tailorboost.com/cn/wp-json/wp/v2/posts',
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, "'")
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCover(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

async function fetchWpPosts(locale: 'en' | 'cn'): Promise<WpPost[]> {
  const url = `${WP_BASES[locale]}?per_page=20&status=publish`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${locale} posts: ${res.status}`)
  return res.json() as Promise<WpPost[]>
}

async function resolveSlug(rawExec: RawExec, slug: string, locale: string) {
  const existing = await rawExec(`SELECT locale FROM cms_posts WHERE slug = ?`, [slug])
  if (existing.rows.length && existing.rows[0]?.locale !== locale) {
    return `${slug}-${locale}`
  }
  return slug
}

async function upsertPost(
  rawExec: RawExec,
  post: WpPost,
  locale: 'en' | 'cn',
  adminId: number | null,
) {
  const baseSlug = decodeSlug(post.slug)
  const slug = await resolveSlug(rawExec, baseSlug, locale)
  const title = stripHtml(post.title.rendered)
  const excerpt = stripHtml(post.excerpt.rendered)
  const content = post.content.rendered.trim()
  const coverImage = extractCover(content)
  const publishedAt = new Date(post.date).getTime()
  const now = Date.now()

  const existing = await rawExec(
    `SELECT id FROM cms_posts WHERE slug = ? AND locale = ?`,
    [slug, locale],
  )

  if (existing.rows[0]?.id) {
    await rawExec(
      `UPDATE cms_posts SET title = ?, excerpt = ?, content = ?, cover_image = ?, published_at = ?, updated_at = ?, status = 'published'
       WHERE id = ?`,
      [title, excerpt, content, coverImage, publishedAt, now, existing.rows[0].id],
    )
  } else {
    await rawExec(
      `INSERT INTO cms_posts (title, slug, locale, excerpt, content, cover_image, status, type, author_id, published_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'published', 'post', ?, ?, ?)`,
      [title, slug, locale, excerpt, content, coverImage, adminId, publishedAt, now],
    )
  }

  return slug
}

/** Import blog posts from tailorboost.com WordPress into cms_posts. */
export async function importTailorBoostBlogPosts(
  rawExec: RawExec,
  adminId: number | null,
  options?: { replace?: boolean },
) {
  if (options?.replace) {
    await rawExec(`DELETE FROM cms_posts WHERE type = 'post'`, [])
  }

  let imported = 0

  for (const locale of ['en', 'cn'] as const) {
    const posts = await fetchWpPosts(locale)
    for (const post of posts) {
      await upsertPost(rawExec, post, locale, adminId)
      imported++
    }
  }

  return imported
}
