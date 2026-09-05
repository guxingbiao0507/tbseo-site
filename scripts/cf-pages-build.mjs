#!/usr/bin/env node
/**
 * Cloudflare Pages build entry (git deploy).
 * Set in CF dashboard:
 *   Build command: pnpm run cf:build
 *   Build output: dist
 *   Node: 20
 *   Env: NITRO_PRESET=cloudflare_pages (optional, set below)
 *
 * For private nuxtcms GitHub dep, set GITHUB_TOKEN in CF Pages secrets
 * and use Install command:
 *   git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:" && pnpm install --frozen-lockfile
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const cwd = join(root, '..')

function run(cmd, args, env = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  })
  if (res.status !== 0) process.exit(res.status || 1)
}

// Fallback: download theme images if public/images/ missing from checkout
if (!existsSync(join(cwd, 'public', 'images', 'logo1.png'))) {
  run('node', ['scripts/download-theme-images.mjs'])
}

run('pnpm', ['exec', 'nuxt', 'build'], { NITRO_PRESET: 'cloudflare_pages' })

const patchWorker = join(cwd, 'node_modules', 'nuxtcms', 'scripts', 'patch-worker.mjs')
if (existsSync(patchWorker)) {
  run('node', [patchWorker])
}

console.log('\n✓ Cloudflare Pages build complete → dist/')
