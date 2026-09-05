#!/usr/bin/env bash
# Cloudflare Pages install hook — run as custom Install command when using private GitHub deps.
set -euo pipefail

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "Configuring git for GitHub HTTPS (private nuxtcms dependency)..."
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
fi

corepack enable
pnpm install --frozen-lockfile
