# Memory Index

- [Lovable TanStack Start dev server setup](lovable-tanstack-vite-config.md) — how to make @lovable.dev/vite-tanstack-config work behind the Replit proxy and deploy on Node instead of Cloudflare Workers.
- [TanStack Start API routes](tanstack-start-server-routes.md) — use `server.handlers` on `createFileRoute`, not `createAPIFileRoute`/`APIRoute` (removed in this installed version).
- [OpenAI provider choice](openai-own-key-preference.md) — user declined Replit AI Integrations; use their own `OPENAI_API_KEY` secret with the standard SDK instead; verify billing/quota is active, not just that the key exists, before declaring AI features done.
- [StartupBridge AI architecture reality](startupbridge-architecture.md) — original spec says Python/FastAPI/Clerk/RAG, actual app is TanStack Start/Drizzle/Replit Auth/direct OpenAI; treat spec as feature checklist not tech mandate.
- [Lovable tagger hydration warning](lovable-tagger-hydration-warning.md) — harmless dev-only console error from lovable-tagger's data-tsd-source attrs; not a real app bug, don't chase it.
