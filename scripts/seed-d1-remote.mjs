/**
 * Export local SQLite CMS data to D1 remote via wrangler.
 * Usage: node scripts/seed-d1-remote.mjs [--posts-only]
 */
import { createClient } from '@libsql/client'
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const postsOnly = process.argv.includes('--posts-only')

function loadEnv() {
  for (const file of ['.env', '.cloudflare.env']) {
    const p = join(root, file)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

function sqlEscape(value) {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replace(/'/g, "''")}'`
}

function getDatabaseUrl() {
  loadEnv()
  const url = process.env.DATABASE_URL || 'file:.data/tbseo.sqlite'
  if (url.startsWith('file:') && !url.startsWith('file:/')) {
    return `file:${resolve(root, url.slice('file:'.length)).replace(/\\/g, '/')}`
  }
  return url
}

async function main() {
  loadEnv()
  const dbName = process.env.CF_D1_DATABASE || 'tbseo'
  const local = createClient({ url: getDatabaseUrl() })

  const statements = []

  if (!postsOnly) {
    const settings = await local.execute('SELECT key, value FROM cms_settings')
    for (const row of settings.rows) {
      statements.push(
        `INSERT INTO cms_settings (key, value) VALUES (${sqlEscape(row.key)}, ${sqlEscape(row.value)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      )
    }
  }

  const posts = await local.execute(`SELECT * FROM cms_posts WHERE type = 'post' AND status = 'published'`)
  for (const p of posts.rows) {
    statements.push(`DELETE FROM cms_posts WHERE slug = ${sqlEscape(p.slug)} AND locale = ${sqlEscape(p.locale)};`)
    statements.push(
      `INSERT INTO cms_posts (title, slug, locale, excerpt, content, cover_image, status, type, author_id, tags, published_at, updated_at)
       VALUES (${sqlEscape(p.title)}, ${sqlEscape(p.slug)}, ${sqlEscape(p.locale)}, ${sqlEscape(p.excerpt)}, ${sqlEscape(p.content)}, ${sqlEscape(p.cover_image)}, 'published', 'post', ${p.author_id ?? 'NULL'}, ${sqlEscape(p.tags)}, ${p.published_at ?? 'NULL'}, ${p.updated_at ?? 'NULL'});`,
    )
  }

  await local.close()

  const sqlFile = join(root, '.tmp-seed-d1.sql')
  writeFileSync(sqlFile, statements.join('\n'), 'utf-8')
  console.log(`Generated ${statements.length} SQL statements for ${posts.rows.length} posts`)

  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.NUXT_CF_API_TOKEN
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.NUXT_CF_ACCOUNT_ID
  const res = spawnSync(
    `pnpm exec wrangler d1 execute ${dbName} --remote --file="${sqlFile}"`,
    {
      cwd: root,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account },
    },
  )

  try { unlinkSync(sqlFile) } catch {}

  if (res.status !== 0) process.exit(res.status || 1)
  console.log('\n✓ D1 remote seed complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
