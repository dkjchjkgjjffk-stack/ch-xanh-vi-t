# Chợ Xanh Việt — Facebook Page bridge

This Worker is a small, private publishing bridge for a Facebook Page. It is separate from the production website and does not publish anything during setup.

## Routes
- `GET /health`: readiness/configuration check.
- `GET /oauth/start`: begins Meta OAuth consent.
- `GET /oauth/callback`: validates the OAuth state, exchanges the code, and lists Pages available to the signed-in Facebook account.
- `POST /oauth/select`: saves the selected Page token in Cloudflare KV.
- `POST /publish`: publishes a text/link post. Requires `Authorization: Bearer <BRIDGE_SECRET>` and JSON `{"message":"...","link":"https://..." }`.

## Cloudflare setup
1. Deploy this folder as a separate Worker named `ch-xanh-viet-facebook-bridge`. Do not deploy it over the main Chợ Xanh Việt website Worker.
2. Create a Cloudflare KV namespace and bind it to the Worker with binding name `FB_BRIDGE_KV`.
3. Add these Worker secrets:
   - `BRIDGE_SECRET`: a long random secret used to protect `POST /publish` and sign OAuth state.
   - `META_APP_ID`: App ID from Meta for Developers.
   - `META_APP_SECRET`: App Secret from Meta for Developers.
4. After deployment, use the exact deployed Worker origin to set Meta's Valid OAuth Redirect URI to:
   `https://YOUR-WORKER-HOST/oauth/callback`
   The origin must match the URL used to open `/oauth/start`. Do not use the main website URL unless this Worker is actually hosted there.
5. In the Meta app, enable Facebook Login for the app and request Page permissions `pages_show_list`, `pages_manage_posts`, and `pages_read_engagement`. The app must be in a mode/account configuration that allows the intended Page admin to authorize it. Meta may require app review/verification for use beyond app roles/testers.
6. Visit `https://YOUR-WORKER-HOST/oauth/start`, sign in to Facebook, approve the requested permissions, and select the intended Page. A successful selection saves the Page token privately in KV.
7. Check `/health` for configuration status. The `storageConfigured` and `oauthConfigured` values should both be `true`.

## Publish request
Send a POST to `https://YOUR-WORKER-HOST/publish` with header `Authorization: Bearer <BRIDGE_SECRET>`, content type `application/json`, and body such as:
```json
{"message":"Bài viết thử nghiệm","link":"https://ch-xanh-vi-t.dkjchjkgjjffk.workers.dev/"}
```
Only send a publish request when you intentionally want a real post published. The endpoint posts immediately to the selected Page.

## Security and limitations
- Never put app secrets, Page access tokens, or `BRIDGE_SECRET` in source control, frontend code, chat, or screenshots.
- OAuth state and temporary Page-selection sessions expire after 10 minutes.
- Page token is stored in Cloudflare KV, not returned to the browser after selection.
- `/publish` is a publishing API, not itself a ChatGPT MCP server. A separate authenticated tool/connector is still needed for direct natural-language publishing from ChatGPT.
- This bridge does not yet include image uploads, scheduling, or token-refresh monitoring.
