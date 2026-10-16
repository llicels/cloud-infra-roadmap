#!/usr/bin/env bash
# Publica o site estatico no Cloudflare Pages (plano gratuito).
# Requer: npx wrangler login  (ou CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID no ambiente)
set -euo pipefail

cd "$(dirname "$0")"

PROJECT_NAME="${PROJECT_NAME:-cloud-infra-roadmap}"

if ! command -v npx >/dev/null 2>&1; then
  echo "erro: npx (Node.js) nao encontrado." >&2
  exit 1
fi

echo ">> Deploy para Cloudflare Pages (projeto: $PROJECT_NAME)"
npx --yes wrangler pages deploy . --project-name "$PROJECT_NAME"
echo ">> Concluido. URL final exibida acima como https://<project>.pages.dev"
