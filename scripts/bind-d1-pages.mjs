#!/usr/bin/env node
/** Bind D1 database to Cloudflare Pages project from wrangler.toml + .cloudflare.env */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const path = join(root, '.cloudflare.env')
  if (!existsSync(path)) throw new Error('Missing .cloudflare.env')
  const text = readFileSync(path, 'utf8')
  const get = key => text.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()
  const token = get('CLOUDFLARE_API_TOKEN')
  const account = get('CLOUDFLARE_ACCOUNT_ID')
  const project = get('CF_PAGES_PROJECT') || 'tbseo'
  if (!token || !account) throw new Error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID')
  return { token, account, project }
}

function parseWranglerD1() {
  const text = readFileSync(join(root, 'wrangler.toml'), 'utf8')
  const binding = text.match(/binding\s*=\s*"([^"]+)"/)?.[1] || 'DB'
  const databaseId = text.match(/database_id\s*=\s*"([^"]+)"/)?.[1]
  if (!databaseId) throw new Error('database_id not found in wrangler.toml')
  return { binding, databaseId }
}

async function cfFetch(env, method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.account}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.errors?.map(e => e.message).join('; ') || res.statusText)
  }
  return json.result
}

async function main() {
  const env = loadEnv()
  const { binding, databaseId } = parseWranglerD1()
  const project = await cfFetch(env, 'GET', `/pages/projects/${env.project}`)

  const d1Binding = { [binding]: { id: databaseId } }
  const r2Bucket = project.deployment_configs?.production?.r2_buckets
  const body = {
    deployment_configs: {
      ...project.deployment_configs,
      production: {
        ...project.deployment_configs?.production,
        d1_databases: d1Binding,
        r2_buckets: r2Bucket,
      },
      preview: {
        ...project.deployment_configs?.preview,
        d1_databases: d1Binding,
        r2_buckets: project.deployment_configs?.preview?.r2_buckets,
      },
    },
  }

  await cfFetch(env, 'PATCH', `/pages/projects/${env.project}`, body)
  console.log(`✓ Bound D1 "${binding}" → ${databaseId} on Pages project "${env.project}"`)
}

main().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
