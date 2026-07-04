---
name: TanStack Start API/server routes
description: Correct convention for raw HTTP endpoints (login/callback/webhooks) in TanStack Start route files, since some docs/examples reference a removed API.
---

Some TanStack Start docs, examples, and skill files (even bundled inside `node_modules/@tanstack/react-start/skills`) reference `createAPIFileRoute` from `@tanstack/react-start/api`. In current versions this export does not exist (no `./api` entry in the package's `exports` map) and using it silently produces a route file the router-generator ignores ("does not export a Route" warning), so the endpoint 404s.

**Why:** Wasted a full debugging cycle because the bundled skill example itself was stale relative to the installed package version — always cross-check a skill's `library_version` frontmatter against the actual installed version before trusting a code sample.

**How to apply:** For raw HTTP endpoints (OAuth login/callback/logout, webhooks, etc.) in a TanStack Start `src/routes/**/*.ts` file, use the `server` property on the normal `createFileRoute` (from `@tanstack/react-router`), exporting `Route` (not `APIRoute`):

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/login")({
  server: {
    handlers: {
      GET: async ({ request }) => new Response(...),
    },
  },
});
```

The full reference for this pattern lives in `node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md` (middleware, dynamic params, `createHandlers` for per-method middleware, etc.) — read that file directly rather than the `react-start/server-components` example, which is the stale one referencing `createAPIFileRoute`.
