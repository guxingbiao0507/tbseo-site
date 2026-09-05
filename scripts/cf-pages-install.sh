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

# Skip better-sqlite3 native compile on CF — runtime uses D1, build uses stub alias
pnpm install --frozen-lockfile --config.allowBuilds[better-sqlite3]=false
