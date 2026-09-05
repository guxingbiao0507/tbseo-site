/**
 * Deploy to Cloudflare Pages and upload public assets to R2.
 * Usage: pnpm run deploy:all [--migrate] [--no-build]
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(cmd, env = {}) {
  console.log(`\n▶ ${cmd}`)
  const res = spawnSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  })
  if (res.status !== 0) process.exit(res.status || 1)
}

const deployArgs = process.argv.slice(2).join(' ')
run(`node node_modules/nuxtcms/scripts/deploy.mjs ${deployArgs}`)
run('node scripts/upload-public-to-r2.mjs')
console.log('\n✅ Deploy + R2 upload complete')
