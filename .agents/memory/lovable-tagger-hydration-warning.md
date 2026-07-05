---
name: Lovable tagger hydration warning
description: Explains a recurring "tree hydrated but attributes didn't match" console error seen on every page load in this project, and why it's not worth fixing.
---

On every page load in dev, the browser console shows a React hydration mismatch error pointing at `data-tsd-source` attributes on `<html>`/`<head>`/`<body>` in `src/routes/__root.tsx`.

**Cause:** `@lovable.dev/vite-tanstack-config` unconditionally adds `lovable-tagger`'s `componentTagger({ jsxSource: true })` plugin when `command === "serve" && mode === "development"` (hardcoded in the package, not exposed as a `defineConfig` option). It injects `data-tsd-source="file:line:col"` attributes into JSX for Lovable's visual editor, and the line/col numbers can differ slightly between the SSR render and the client re-render, producing a hydration diff.

**Why it's safe to ignore:** It never affects functionality — verified by reproducing full user flows (auth, messaging, CRUD) end-to-end with no crashes or broken behavior. It only fires as a `console.error`, not an uncaught exception, so it does not trigger error boundaries or break the app.

**How to apply:** If a user reports "an error" that turns out to be this exact hydration/`data-tsd-source` message, explain it's a harmless dev-only artifact of the Lovable import tooling rather than spending more time chasing it. Removing it would require patching `node_modules` (fragile) since it's not user-configurable via `defineConfig`.
