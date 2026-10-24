# Facebook Page Bridge (separate from the Chợ Xanh Việt website)

This is a small Cloudflare Worker that publishes **text/link posts to a Facebook Page** through Meta Graph API. It is deliberately isolated in its own directory and branch so it does not change the existing site's build or deployment.

## Required Cloudflare Worker secrets

Set these with Cloudflare Worker secret storage (not in GitHub files, source code, or chat):

- `BRIDGE_SECRET`: a long random secret used by the caller to authorize publishing.
- `FACEBOOK_PAGE_ID`: numeric Page ID for the intended Facebook Page.
- `FACEBOOK_PAGE_ACCESS_TOKEN`: Page access token issued by Meta for that Page.

The Meta app/user needs Page access and the appropriate permissions, commonly `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`. The person authorizing the app must have permission to create content on the Page. Meta may require additional review/verification depending on how the app is used.

## Deploy

From this directory using Wrangler:
1. `npx wrangler login`
2. `npx wrangler deploy`
3. Add the three secrets using `npx wrangler secret put BRIDGE_SECRET`, `npx wrangler secret put FACEBOOK_PAGE_ID`, and `npx wrangler secret put FACEBOOK_PAGE_ACCESS_TOKEN`.

Do not run these commands until the Worker is deployed under the correct Cloudflare account and the secrets are ready.

## Endpoints

- `GET /health`: basic health check only; exposes no configuration.
- `POST /publish`: requires `Authorization: Bearer <BRIDGE_SECRET>` and JSON `{"message":"...","link":"https://..." }` (link optional).

Example request:
```sh
curl -X POST "https://YOUR-WORKER-URL/publish" \
  -H "Authorization: Bearer YOUR_BRIDGE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"message":"Bài viết thử nghiệm","link":"https://example.com"}'
```

A successful response contains a post ID. The Worker never returns the Page access token. The endpoint is a **publishing API, not an MCP server**. ChatGPT Free does not currently support adding custom MCP servers with write actions, so a separate supported caller/UI or a supported ChatGPT plan/workspace is still required for direct natural-language invocation. Do not expose this endpoint publicly without the bearer secret and do not place secrets in browser JavaScript.

## Current limitations

Text and HTTPS-link posts only. No images, videos, comments, insights, scheduling, OAuth login, or automatic token refresh yet. Test with a non-sensitive post first and verify the target Page ID before publishing.
