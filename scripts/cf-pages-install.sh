#!/usr/bin/env bash
# Cloudflare Pages install hook — run as part of build command.
set -euo pipefail

export NITRO_PRESET=cloudflare_pages
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "Configuring git for GitHub HTTPS (private nuxtcms dependency)..."
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
fi

corepack enable
corepack prepare pnpm@10.28.2 --activate

echo "Node $(node -v) | pnpm $(pnpm -v) | NITRO_PRESET=${NITRO_PRESET}"

# oxc-parser@0.141 requires Node ^20.19.0 || >=22.12.0 — fail early with a clear message
node -e "
const [maj, min] = process.version.slice(1).split('.').map(Number);
const ok = (maj === 20 && min >= 19) || (maj >= 22 && (maj > 22 || min >= 12));
if (!ok) {
  console.error('✗ Node', process.version, 'is too old for Nuxt 4 / oxc-parser. Use Node 20.19+ or 22.12+.');
  process.exit(1);
}
"

# Skip better-sqlite3 native compile on CF — runtime uses D1, build uses stub alias
pnpm install --frozen-lockfile --config.allowBuilds[better-sqlite3]=false
