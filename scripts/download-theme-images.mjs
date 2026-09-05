/**
 * Download TailorBoost theme images from WordPress CDN into public/images/.
 * Run: pnpm run download:images
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'images')

const REMOTE_BASE = 'https://tailorboost.com/us/wp-content/themes/tbseo/images'

const THEME_IMAGES = [
  'logo1.png',
  'logo2.png',
  'cloud.png',
  'summary1.png',
  'summary2.png',
  'summary3.png',
  'summary4.png',
  'feature-bg.png',
  'demo1.png',
  'demo2.png',
  'demo3.png',
  'advandge-bg.png',
  'advantage1.png',
  'blog-header.png',
]

async function download(name) {
  const url = `${REMOTE_BASE}/${name}`
  const dest = join(outDir, name)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(outDir, { recursive: true })
  await writeFile(dest, buf)
  const hash = createHash('md5').update(buf).digest('hex').slice(0, 8)
  console.log(`  ✓ ${name} (${buf.length} bytes, md5:${hash})`)
  return dest
}

async function syncFavicons() {
  const logo = join(outDir, 'logo1.png')
  if (!existsSync(logo)) return
  console.log('  ✓ favicon uses /images/logo1.png')
}

async function main() {
  console.log(`Downloading ${THEME_IMAGES.length} theme images → public/images/`)
  let ok = 0
  let fail = 0
  for (const name of THEME_IMAGES) {
    try {
      await download(name)
      ok++
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`)
      fail++
    }
  }
  await syncFavicons()
  console.log(`\nDone: ${ok} downloaded, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
