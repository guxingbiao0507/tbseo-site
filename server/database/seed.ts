import { count } from 'drizzle-orm'
import type { DB } from './index'
import { schema } from './index'
import { createClient } from '@libsql/client'
import { seedBlogPosts } from './seed-blog'

type D1Database = any

export async function needsSetup(db: DB): Promise<boolean> {
  const row = await db.select({ c: count() }).from(schema.users).get()
  return (row?.c ?? 0) === 0
}

export async function runInstall(db: DB, input: { name: string; email: string; passwordHash: string; siteName?: string; siteDescription?: string }, d1?: D1Database) {
  if (!(await needsSetup(db))) {
    throw createError({ statusCode: 403, statusMessage: '站点已初始化' })
  }

  const now = new Date()

  // Execute raw SQL. Use D1 binding on Cloudflare, libSQL client locally.
  async function rawExec(sql: string, params: any[]): Promise<{ lastInsertRowid: number; rows: any[] }> {
    if (d1) {
      const result = await d1.prepare(sql).bind(...params).all()
      return { lastInsertRowid: Number(result.meta.last_row_id), rows: result.results || [] }
    }
    const url = process.env.DATABASE_URL || `file:.data/${process.env.DATABASE_NAME || 'cms'}.sqlite`
    const raw = createClient({ url })
    const result = await raw.execute(sql, params)
    await raw.close()
    return { lastInsertRowid: Number(result.lastInsertRowid), rows: result.rows as any[] }
  }

  // Insert admin user
  const adminResult = await rawExec(
    `INSERT INTO cms_users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [input.name, input.email.toLowerCase(), input.passwordHash, 'admin']
  )
  const adminId = adminResult.lastInsertRowid

  const siteName = input.siteName || 'TailorBoost'
  const siteDescription = input.siteDescription || 'TailorBoost – Your Trusted Partner for International Expansion. Professional SEO optimization with 15+ years of experience.'

  // Settings use drizzle (no auto-increment issues)
  const defaultSettings: Record<string, string> = {
    siteName,
    siteDescription,
    footerText: `© ${now.getFullYear()} TailorBoost. All rights reserved.`,
    companyPhone: '',
    companyPhone2: '',
    companyPhone3: '',
    companyEmail: 'tailorboost@outlook.com',
    companyAddress: 'Finland · New Zealand · China',
    companyHours: 'Mon-Fri 8:00-17:00',
    postsPerPage: '9',
    ga4MeasurementId: 'GT-TNC4SKVD',
    bingSiteVerification: '8690095404B1D2C9E27332A5E5C889CE',
    googleVerification: 'vTlCwi7aR1KIiK_bYP-lBwWIspwnONuIMKB2OFnpLDY',
    clarityProjectId: 'rrkm4zjn1o',
  }
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } }).run()
  }

  // Seed TailorBoost blog posts (en + cn) and about pages
  await seedBlogPosts(db, adminId, rawExec)

  return { adminId }
}
