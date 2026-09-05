import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const uploadsDir = join(root, 'public', 'uploads', 'blog')

function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

function getDatabaseUrl() {
  loadEnv()
  const url = process.env.DATABASE_URL || 'file:.data/tbseo.sqlite'
  if (url.startsWith('file:') && !url.startsWith('file:/')) {
    const rel = url.slice('file:'.length)
    return `file:${resolve(root, rel).replace(/\\/g, '/')}`
  }
  return url
}

function toDbTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000)
}

const WP_BASES = {
  en: 'https://tailorboost.com/us/wp-json/wp/v2/posts',
  cn: 'https://tailorboost.com/cn/wp-json/wp/v2/posts',
}

const BLOG_LIST_PAGES = {
  en: 'https://tailorboost.com/us/blogs/',
  cn: 'https://tailorboost.com/cn/blogs/',
}

function decodeSlug(slug) {
  try { return decodeURIComponent(slug) } catch { return slug }
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, "'")
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashName(input) {
  return createHash('md5').update(input).digest('hex').slice(0, 12)
}

async function downloadImage(url, destPath) {
  if (!url || !url.startsWith('http')) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, buf)
    return destPath.replace(/\\/g, '/').replace(/^.*?\/public/, '')
  } catch {
    return null
  }
}

async function localizeImages(html, slug, locale) {
  const imgRegex = /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi
  let result = html
  const matches = [...html.matchAll(imgRegex)]
  for (const match of matches) {
    const full = match[0]
    const src = match[2]
    if (!src.startsWith('http')) continue
    const ext = extname(new URL(src).pathname) || '.jpg'
    const fileName = `${locale}-${hashName(slug + src)}${ext}`
    const localPath = join(uploadsDir, fileName)
    const publicPath = await downloadImage(src, localPath)
    if (publicPath) {
      result = result.replace(full, full.replace(src, publicPath))
    }
  }
  return result
}

function extractCover(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

async function fetchCoverMap(locale) {
  const html = await fetch(BLOG_LIST_PAGES[locale]).then(r => r.text())
  const map = new Map()
  const blocks = html.split('blog-item')
  for (const block of blocks) {
    const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i)
    const linkMatch = block.match(/href=["'][^"']*\/([^/"'?#]+)\/?["']/i)
    if (imgMatch && linkMatch) {
      const slug = decodeSlug(linkMatch[1])
      map.set(slug, imgMatch[1])
    }
  }
  return map
}

async function fetchWpPosts(locale) {
  const res = await fetch(`${WP_BASES[locale]}?per_page=20&status=publish&_embed`)
  if (!res.ok) throw new Error(`Failed to fetch ${locale} posts: ${res.status}`)
  return res.json()
}

async function resolveSlug(rawExec, slug, locale) {
  const existing = await rawExec(`SELECT locale FROM cms_posts WHERE slug = ?`, [slug])
  if (existing.rows.length && existing.rows[0]?.locale !== locale) {
    return `${slug}-${locale}`
  }
  return slug
}

async function upsertPost(rawExec, post, locale, adminId, coverMap) {
  const baseSlug = decodeSlug(post.slug)
  const slug = await resolveSlug(rawExec, baseSlug, locale)
  const title = stripHtml(post.title.rendered)
  const excerpt = stripHtml(post.excerpt.rendered)
  let content = post.content.rendered.trim()
  content = await localizeImages(content, slug, locale)

  let coverImage = coverMap.get(baseSlug) || coverMap.get(slug) || extractCover(content)
  if (coverImage?.startsWith('http')) {
    const ext = extname(new URL(coverImage).pathname) || '.png'
    const fileName = `${locale}-${hashName(slug + '-cover')}${ext}`
    const local = await downloadImage(coverImage, join(uploadsDir, fileName))
    if (local) coverImage = local
  }

  const publishedAt = toDbTimestamp(post.date)
  const now = toDbTimestamp(new Date())

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

  return { slug, title, coverImage }
}

async function main() {
  const replace = process.argv.includes('--replace')
  const url = getDatabaseUrl()
  console.log(`Using database: ${url}`)
  const raw = createClient({ url })

  async function rawExec(sql, params = []) {
    const result = await raw.execute({ sql, args: params })
    return { rows: result.rows }
  }

  const adminRow = await rawExec(`SELECT id FROM cms_users LIMIT 1`)
  const adminId = adminRow.rows[0]?.id ?? null
  if (!adminId) console.warn('No admin user; posts will have null author_id.')

  if (replace) {
    await rawExec(`DELETE FROM cms_posts WHERE type = 'post'`, [])
    console.log('Removed existing blog posts.')
  }

  let imported = 0
  for (const locale of ['en', 'cn']) {
    const coverMap = await fetchCoverMap(locale)
    const posts = await fetchWpPosts(locale)
    for (const post of posts) {
      const { slug, title, coverImage } = await upsertPost(rawExec, post, locale, adminId, coverMap)
      imported++
      console.log(`  [${locale}] ${title}`)
      console.log(`           slug: ${slug}`)
      if (coverImage) console.log(`           cover: ${coverImage}`)
    }
  }

  console.log(`\nImported ${imported} posts (images saved to public/uploads/blog/)`)
  await raw.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
