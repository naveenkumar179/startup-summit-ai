---
name: Lovable TanStack Start dev server setup
description: How to run a @lovable.dev/vite-tanstack-config (TanStack Start + Nitro) project behind the Replit proxy and deploy it as a Node process instead of Cloudflare Workers.
---

Projects imported from Lovable using `@lovable.dev/vite-tanstack-config` default their Vite dev/preview server to `host: "::", port: 8080` with no `allowedHosts` override, and their Nitro build to the `cloudflare-module` preset — neither works out of the box in Replit.

- **Dev server behind proxy**: pass `vite: { server: { host: "0.0.0.0", port: 5000, strictPort: true, allowedHosts: true }, preview: { ...same } }` into `defineConfig()`. Without `allowedHosts: true`, the Replit iframe proxy's Host header gets a 403 from Vite.
- **Production build target**: pass `nitro: { preset: "node-server" }` into `defineConfig()` (top-level option, not under `vite`). Without this, `bun run build` emits a Cloudflare Worker bundle (`.output/server/index.mjs` built for `wrangler`/workers runtime) with a `wrangler.json`, which is not directly runnable as a plain Node server. With `node-server` preset, `.output/server/index.mjs` is a standard Node HTTP server that honors `PORT` and binds all interfaces — deploy with `run: ["node", ".output/server/index.mjs"]`.
- **Why**: Replit's dev preview is an iframe proxy (arbitrary Host headers) and its deployments run containers via a shell command, not Cloudflare Workers — both defaults from the Lovable sandbox config target Lovable's own infra instead.
