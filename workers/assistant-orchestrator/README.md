# Hải Tây Phát Assistant Worker

A separate, admin-authenticated orchestration MVP. It does not replace the public website Worker.

## Current capabilities
- Admin login verified against Supabase Auth and \`public.user_roles\`.
- Read-only AI chat using Cloudflare Workers AI model \`@cf/meta/llama-3.1-8b-instruct\`.
- Admin status panel for latest public prices and recent price-sync runs.
- Explicit, confirmed action to run \`sync-agricultural-prices\`.
- Per-isolate best-effort rate limit (12 chat requests/minute/user), short-lived browser token in \`sessionStorage\`, and no service-role key in browser code.

## Required bindings/secrets
- AI binding: \`AI\`
- vars: \`SUPABASE_URL\`, \`SUPABASE_PUBLISHABLE_KEY\`
- secret: \`PRICE_SYNC_TOKEN\` (same value stored in Supabase Vault as \`assistant_price_sync_token\`)

## Deploy
Use the Cloudflare dashboard or API to upload \`index.js\` with the AI binding and vars, then set \`PRICE_SYNC_TOKEN\` as a Worker secret. Never put the secret in GitHub.

## Security boundary
Chat is read-only. The only write action in this version is the dedicated, explicit price-sync button. Facebook and YouTube are intentionally marked not connected until OAuth/API permissions are configured.
