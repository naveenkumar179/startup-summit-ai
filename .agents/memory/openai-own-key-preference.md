---
name: OpenAI provider choice for this project
description: Why this project uses a user-supplied OPENAI_API_KEY instead of Replit AI Integrations
---

The user declined the Replit AI Integrations upgrade prompt for OpenAI access. Do not retry
`setup_replit_ai_integrations` / `addIntegration("blueprint:javascript_openai_ai_integrations")`
for this project.

Instead, use `requestEnvVar` to collect the user's own `OPENAI_API_KEY` secret, and instantiate
the standard OpenAI SDK client with `apiKey: process.env.OPENAI_API_KEY` (no custom `baseURL`).

**Why:** the user explicitly declined the AI Integrations billing-to-credits flow when prompted.

**How to apply:** if new AI features are added later, reuse the existing `OPENAI_API_KEY` secret
and `getOpenAIClient()` helper rather than re-adding the AI Integrations blueprint.

**Key validation gotcha:** when a 429 `insufficient_quota` error prompts asking the user for a
fresh key, they may paste a key from the wrong provider (e.g. a Google key starting `AIzaSy...`)
without noticing. OpenAI keys start with `sk-`. After `requestEnvVar` returns, restart the workflow
and check the next AI call's logs for a 401 `invalid_api_key` — if seen, re-request and explicitly
tell the user their key doesn't match OpenAI's format before they paste again.
