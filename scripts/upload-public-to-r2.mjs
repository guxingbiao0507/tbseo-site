/**
 * Upload public/images and public/uploads to Cloudflare R2 (bucket: tbseo).
 * Also mirrors files into .data/uploads/ for local /api/media/ serving.
 *
 * Run: pnpm run upload:r2
 * Requires .cloudflare.env with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadCloudflareEnv() {
  const envPath = join(root, '.cloudflare.env')
  if (!existsSync(envPath)) {
    console.error('✗ Missing .cloudflare.env — copy from .cloudflare.env.example')
    process.exit(1)
  }
  const text = readFileSync(envPath, 'utf8')
  const get = (key) => text.match(new RegExp(`${key}=(\\S+)`))?.[1]
  const token = get('CLOUDFLARE_API_TOKEN')
  const account = get('CLOUDFLARE_ACCOUNT_ID')
  const bucket = get('CF_R2_BUCKET') || 'tbseo'
  if (!token || !account) {
    console.error('✗ .cloudflare.env needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID')
    process.exit(1)
  }
  return { token, account, bucket }
}

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

function contentType(file) {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] || 'application/octet-stream'
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/** Map public path → R2 object key */
function toR2Key(publicRel) {
  const norm = publicRel.replace(/\\/g, '/')
  if (norm.startsWith('images/')) return `static/${norm}`
  if (norm.startsWith('uploads/')) return norm
  return `static/${norm}`
}

function mirrorToLocalData(key, srcPath) {
  const dest = join(root, '.data', 'uploads', key)
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(srcPath, dest)
}

async function putObject({ token, account, bucket }, key, filePath, retries = 3) {
  const buf = readFileSync(filePath)
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType(filePath),
        },
        body: buf,
        signal: ctrl.signal,
      })
      clearTimeout(timeout)
      if (res.ok) return true
      if (i === retries - 1) console.error(`  ✗ ${key}: HTTP ${res.status}`)
    } catch (e) {
      if (i === retries - 1) console.error(`  ✗ ${key}: ${e.message}`)
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  return false
}

async function main() {
  const cf = loadCloudflareEnv()
  const sources = [
    join(root, 'public', 'images'),
    join(root, 'public', 'uploads'),
  ]

  const files = []
  for (const srcRoot of sources) {
    if (!existsSync(srcRoot)) continue
    const base = join(root, 'public')
    for (const file of walk(srcRoot)) {
      const rel = relative(base, file).replace(/\\/g, '/')
      files.push({ rel, path: file, key: toR2Key(rel) })
    }
  }

  if (files.length === 0) {
    console.log('No files to upload — run pnpm run download:images first')
    return
  }

  console.log(`Uploading ${files.length} files to R2 bucket "${cf.bucket}"`)
  let ok = 0
  let fail = 0
  const BATCH = 8

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH)
    for (const f of batch) mirrorToLocalData(f.key, f.path)
    const results = await Promise.all(batch.map(f => putObject(cf, f.key, f.path)))
    for (const r of results) (r ? ok++ : fail++)
    process.stdout.write(`\r  ${Math.min(i + BATCH, files.length)}/${files.length} (ok=${ok} fail=${fail})`)
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed`)
  console.log('Local mirror: .data/uploads/ (for /api/media/ in dev)')
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
