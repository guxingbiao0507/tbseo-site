/**
 * Mirror public/images and public/uploads into .data/uploads/ for local /api/media/ serving.
 * Run: pnpm run sync:assets
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const dataDir = join(root, '.data', 'uploads')

function toKey(publicRel) {
  const norm = publicRel.replace(/\\/g, '/')
  if (norm.startsWith('images/')) return `static/${norm}`
  if (norm.startsWith('uploads/')) return norm
  return `static/${norm}`
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

let count = 0
for (const sub of ['images', 'uploads']) {
  const srcRoot = join(publicDir, sub)
  if (!existsSync(srcRoot)) continue
  for (const file of walk(srcRoot)) {
    const rel = relative(publicDir, file).replace(/\\/g, '/')
    const key = toKey(rel)
    const dest = join(dataDir, key)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(file, dest)
    count++
  }
}

console.log(`Mirrored ${count} files to .data/uploads/`)
