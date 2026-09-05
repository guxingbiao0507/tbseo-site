import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { createClient } from '@libsql/client'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

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

const ADMIN = {
  siteName: 'TailorBoost',
  siteDescription: 'TailorBoost – Your Trusted Partner for International Expansion',
  name: 'TailorBoost Admin',
  email: 'admin@tailorboost.com',
  password: 'TailorBoost@2026',
}

const url = getDatabaseUrl()
const raw = createClient({ url })

async function hashPassword(password) {
  const scrypt = new Scrypt({ cost: 16384, blockSize: 8, parallelization: 1, maxMemory: 33554432 })
  const hash = new Hash(scrypt)
  return hash.make(password)
}

async function upsertSettings() {
  const settings = {
    siteName: ADMIN.siteName,
    siteDescription: ADMIN.siteDescription,
    footerText: `© ${new Date().getFullYear()} TailorBoost. All rights reserved.`,
    companyEmail: 'tailorboost@outlook.com',
    companyAddress: 'Finland · New Zealand · China',
    postsPerPage: '9',
    ga4MeasurementId: 'GT-TNC4SKVD',
    bingSiteVerification: '8690095404B1D2C9E27332A5E5C889CE',
    googleVerification: 'vTlCwi7aR1KIiK_bYP-lBwWIspwnONuIMKB2OFnpLDY',
    clarityProjectId: 'rrkm4zjn1o',
  }
  for (const [key, value] of Object.entries(settings)) {
    await raw.execute({
      sql: `INSERT INTO cms_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, value],
    })
  }
}

async function main() {
  const users = await raw.execute(`SELECT id, email FROM cms_users LIMIT 5`)

  if (users.rows.length === 0) {
    const passwordHash = await hashPassword(ADMIN.password)
    await raw.execute({
      sql: `INSERT INTO cms_users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      args: [ADMIN.name, ADMIN.email.toLowerCase(), passwordHash],
    })
    console.log('\n✓ Admin account created\n')
    console.log('Admin URL:  http://localhost:3004/admin/login')
    console.log('Email:      ' + ADMIN.email)
    console.log('Password:   ' + ADMIN.password)
    console.log('\nPlease change the password after first login.\n')
  } else {
    console.log('Admin already exists:')
    for (const u of users.rows) console.log(`  - ${u.email}`)
  }

  await upsertSettings()
  console.log('Analytics settings saved (GA4 GT-TNC4SKVD, Bing Webmaster, Google verification).')
  await raw.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
