#!/usr/bin/env node
/**
 * Apply Cloudflare Pages build settings and env vars from .cloudflare.env
 * Run: node scripts/configure-cf-pages.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const path = join(root, '.cloudflare.env')
  if (!existsSync(path)) {
    console.error('✗ Missing .cloudflare.env')
    process.exit(1)
  }
  const text = readFileSync(path, 'utf8')
  const get = (key) => text.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()
  const token = get('CLOUDFLARE_API_TOKEN')
  const account = get('CLOUDFLARE_ACCOUNT_ID')
  const project = get('CF_PAGES_PROJECT') || 'tbseo'
  if (!token || !account) {
    console.error('✗ .cloudflare.env needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID')
    process.exit(1)
  }
  return {
    token,
    account,
    project,
    githubToken: get('GITHUB_TOKEN'),
    siteUrl: get('NUXT_PUBLIC_SITE_URL'),
  }
}

async function cfFetch(env, method, path, body) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.account}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) {
    const msg = json.errors?.map(e => e.message).join('; ') || res.statusText
    throw new Error(msg)
  }
  return json.result
}

function envVar(value, type = 'plain_text') {
  return { value, type }
}

function mergeEnvVars(existing = {}, additions = {}) {
  return { ...existing, ...additions }
}

async function main() {
  const env = loadEnv()
  const project = await cfFetch(env, 'GET', `/pages/projects/${env.project}`)

  const productionEnv = mergeEnvVars(project.deployment_configs?.production?.env_vars, {
    NUXT_PUBLIC_USE_R2_MEDIA: envVar('true'),
    SKIP_DEPENDENCY_INSTALL: envVar('1'),
    ...(env.siteUrl ? { NUXT_PUBLIC_SITE_URL: envVar(env.siteUrl) } : {}),
    ...(env.githubToken ? { GITHUB_TOKEN: envVar(env.githubToken, 'secret_text') } : {}),
  })

  const previewEnv = mergeEnvVars(project.deployment_configs?.preview?.env_vars, {
    NUXT_PUBLIC_USE_R2_MEDIA: envVar('true'),
    SKIP_DEPENDENCY_INSTALL: envVar('1'),
    ...(env.githubToken ? { GITHUB_TOKEN: envVar(env.githubToken, 'secret_text') } : {}),
  })

  const body = {
    build_config: {
      ...project.build_config,
      build_command: 'bash scripts/cf-pages-install.sh && pnpm run cf:build',
      destination_dir: 'dist',
    },
    deployment_configs: {
      ...project.deployment_configs,
      production: {
        ...project.deployment_configs?.production,
        env_vars: productionEnv,
      },
      preview: {
        ...project.deployment_configs?.preview,
        env_vars: previewEnv,
      },
    },
  }

  await cfFetch(env, 'PATCH', `/pages/projects/${env.project}`, body)

  console.log(`✓ Updated Cloudflare Pages project "${env.project}"`)
  console.log('  Build:  bash scripts/cf-pages-install.sh && pnpm run cf:build → dist')
  console.log('  Env:    NUXT_PUBLIC_USE_R2_MEDIA=true, SKIP_DEPENDENCY_INSTALL=1')
  if (env.siteUrl) console.log(`  Env:    NUXT_PUBLIC_SITE_URL=${env.siteUrl}`)
  if (env.githubToken) console.log('  Env:    GITHUB_TOKEN=*** (secret)')
  else console.warn('  ⚠ GITHUB_TOKEN not in .cloudflare.env — add it for private nuxtcms install')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
