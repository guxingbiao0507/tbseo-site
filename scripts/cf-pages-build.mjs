#!/usr/bin/env node
/**
 * Cloudflare Pages build entry (git deploy).
 * Uses direct node invocation — avoids pnpm exec SIGSEGV on CF build workers.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const cwd = join(root, '..')

const buildEnv = {
  ...process.env,
  NITRO_PRESET: 'cloudflare_pages',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
}

function runNode(args, label) {
  console.log(`\n> node ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`)
  const res = spawnSync(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    env: buildEnv,
    shell: false,
  })
  if (res.error) {
    console.error(`✗ ${label || 'command'} failed:`, res.error.message)
    process.exit(1)
  }
  if (res.signal) {
    console.error(`✗ ${label || 'command'} killed by signal ${res.signal}`)
    process.exit(1)
  }
  if (res.status !== 0) {
    process.exit(res.status || 1)
  }
}

// Fallback: download theme images if public/images/ missing from checkout
if (!existsSync(join(cwd, 'public', 'images', 'logo1.png'))) {
  runNode([join(cwd, 'scripts/download-theme-images.mjs')], 'download-theme-images')
}

const nuxtBin = join(cwd, 'node_modules/nuxt/bin/nuxt.mjs')
if (!existsSync(nuxtBin)) {
  console.error('✗ nuxt not found — run pnpm install first')
  process.exit(1)
}

runNode([nuxtBin, 'build'], 'nuxt build')

const patchWorker = join(cwd, 'node_modules/nuxtcms/scripts/patch-worker.mjs')
if (existsSync(patchWorker)) {
  runNode([patchWorker], 'patch-worker')
}

console.log('\n✓ Cloudflare Pages build complete → dist/')
