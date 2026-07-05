---
name: StartupBridge AI project architecture reality vs. original spec
description: The original prompt for this app specified Python/FastAPI/Clerk/LangChain/ChromaDB, but the actual built app uses TanStack Start + Drizzle + Replit Auth + direct OpenAI calls. Read this before applying spec text literally.
---

The project has a long spec file in `attached_assets/` (Pasted-You-are-a-Senior-Full-Stack-AI-Engineer...txt) describing a "StartupBridge AI" app with a Python/FastAPI/Clerk/LangChain/LangGraph/ChromaDB/RAG stack.

**The actual implementation does not follow that stack.** It's a TanStack Start (React) app with Drizzle/Postgres, Replit Auth (OIDC), and direct OpenAI API calls (no RAG/vector DB/LangGraph). Founder and investor dashboards, startup CRUD, pitch deck upload/analysis, matching, watchlist, messaging, and due-diligence chat are already implemented feature-equivalents of the spec's modules.

**Why:** Don't rewrite to Python/FastAPI/Clerk to match the spec literally — treat the spec as a feature/requirements checklist, not a tech-stack mandate. The existing stack is functional and integrated with Replit Auth/DB already.

**How to apply:** When asked to "complete remaining modules" per the spec, map spec module names to equivalent existing routes/components first (they likely already exist under `src/routes/founder/`, `src/routes/investor/`, `src/routes/startups/`) before building new ones. Modules not yet present as of this writing: Meetings scheduler, Admin dashboard, Notifications system, downloadable PDF due-diligence report export, public Pricing page content, RAG-based/web-search-augmented chat (current chat/analysis only reads the pitch deck text directly via OpenAI, no ChromaDB/vector retrieval or web search tool).

The spec also explicitly says to build "module-by-module" and "stop and wait for approval before moving to the next module" — respect that and check in with the user between modules rather than building everything at once.
