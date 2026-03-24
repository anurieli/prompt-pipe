# PromptPipe

A prompt lifecycle manager and pipeline orchestration tool. Every idea is a prompt. Every prompt gets a pipeline.

## What This Is

PromptPipe lets you drop in raw ideas (prompts), build configurable pipelines of AI tools (Claude, Perplexity, GPT, Ollama, webhooks, scripts), and control the full lifecycle of each prompt as it flows through those tools. Human-in-the-loop at every stage — not fire-and-forget.

## Tech Stack

- **Framework**: Next.js 16 (App Router, `src/` directory)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Database/Backend**: Convex (reactive queries, server-side functions, real-time subscriptions)
- **State**: Zustand (ephemeral UI state only — `activeIdeaId`, `selectedStepId`, `selectedThreadId`, `rightPanelTab`)
- **Output Rendering**: react-markdown + remark-gfm
- **Validation**: Zod at boundaries + Convex schema validation
- **API Keys**: AES-256-GCM encrypted at rest in Convex, never returned to client
- **Fonts**: DM Serif Display, Outfit, JetBrains Mono (via next/font/google)

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with ConvexProvider + AppShell
│   ├── page.tsx            # Main app (pipeline view)
│   ├── analytics/          # Analytics page (usage tracking, cost breakdown)
│   └── settings/           # Settings page (API keys, preferences, TOC)
├── components/             # React components
│   ├── layout/             # Topbar, AppShell, AppSidebar, RightPanel, RunBar, CreditIndicator
│   ├── queue/              # QueueList, QueueItem
│   ├── pipeline/           # PipelineView, StepCard, StepDetail, AddStep, InputSourcePicker, ThreadLane, ThreadAdder, TierPicker
│   ├── seed/               # SeedBox (prompt input)
│   ├── modals/             # ToolPickerModal, PipePickerModal, SeedModal, ModelPicker, HelpModal
│   ├── settings/           # APIKeyForm, DefaultModels, ExecutionPreferences, DataManagement, OnboardingCard, UsageOverview, SettingsToc
│   ├── analytics/          # StatCards, UsageByModel, UsageOverTime
│   ├── output/             # MediaOutput, OutputFormatEditor
│   ├── providers/          # ConvexClientProvider
│   └── shared/             # Button, Tag, StatusDot, Annotation, Tooltip
├── stores/                 # Zustand (ephemeral UI state only)
│   └── ui-store.ts         # activeIdeaId, selectedStepId, selectedThreadId, rightPanelTab, newIdeaModal
├── hooks/                  # React hooks
│   └── use-pipeline-stream.ts  # Pipeline execution via Convex actions
├── lib/                    # Client-side utilities
│   ├── format.ts           # Cost, token, and relative time formatters
│   ├── providers/          # LLM provider adapters (kept for reference)
│   ├── pipeline/           # Variable resolver, type checker (also in convex/lib/)
│   ├── logging/            # Client-side logger stub (logging is server-side)
│   └── validators/         # Zod schemas (shared between src/ and convex/)
├── types/                  # Shared TypeScript types
└── config/                 # Static config (provider definitions, model lists, starter pipes)

convex/
├── schema.ts               # Database schema (9 tables including usageRecords, threadRuns)
├── analytics/              # Usage tracking (mutations + aggregation queries)
├── ideas/                  # CRUD queries + mutations
├── steps/                  # Pipeline step queries + mutations
├── threads/                # Step thread queries + mutations
├── threadRuns/             # Thread execution history (per-run output records)
├── settings/               # Encrypted settings (queries, mutations, actions, credit check)
├── pipeline/               # Pipeline execution engine (actions, mutations, queries, suggest)
├── logs/                   # Structured logging
├── models/                 # OpenRouter model listing
├── export/                 # Idea export
└── lib/                    # Server-side utilities
    ├── providers/          # OpenRouter + Webhook adapters
    ├── variable-resolver.ts
    └── type-checker.ts
```

## Design System

The UI follows a "Signal Routing Console" aesthetic:
- **Palette**: Warm dark tones (#111110 base), gold accent (#f0c446)
- **Typography**: DM Serif Display (titles), Outfit (body), JetBrains Mono (code/labels)
- **Node type colors**: Blue (Research), Gold (Analyze), Green (Generate), Orange (Transform), Lavender (Webhook), Teal (Script)

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npx convex dev       # Start Convex dev server (run alongside npm run dev)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest
```

## Convex Setup

To run the app, you need both Next.js and Convex dev servers running:

1. `npx convex dev` — initializes/syncs schema, generates types, starts Convex
2. Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local` (printed during `npx convex dev`)
3. Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Set encryption key: `npx convex env set ENCRYPTION_KEY <key>`
5. `npm run dev` — starts Next.js

## Code Standards

- Zod validation at all external boundaries (API responses, user input, file reads)
- Convex schema validation for database operations
- API keys encrypted with AES-256-GCM at rest, never returned to client in plaintext
- Strict TypeScript — no `any` (except Convex `v.any()` for OutputMedia union)
- Named exports only
- All components in their own file, co-located with types
- Structured logging via Convex mutations (no console.log)
- Tests required for all pipeline execution logic and provider adapters

## Active Technologies
- TypeScript 5.x (strict mode) + Next.js 16, React 19, Convex, Zustand (ephemeral), Zod, openai SDK, react-markdown, remark-gfm
- Convex as sole database and backend (reactive real-time, server-side functions)

## Recent Changes
- 007-credit-rerun-history: Fixed credit indicator (tries `/api/v1/credits` for account balance before falling back to per-key limit; never shows "unlimited"). Per-step rerun via `rerunFromStep` mutation + `fromStepIndex` arg on `runPipeline` — retry button on failed steps, refresh icon on completed steps. Output history via `threadRuns` table storing every execution attempt per thread — run selector pills in right panel to browse and restore past outputs. 402 errors enriched with actionable "add credits" message.
- 006-model-catalog-and-api-gate: Replaced 3-tier model system with curated provider-grouped catalog (14 models, 5 providers). `TierPicker` rewritten with provider tabs + role badges. Default model setting wired into pipeline creation. Full-page API key gate blocks UI until OpenRouter key saved.
- 005-analytics-and-layout: Full analytics system with persistent `usageRecords` table tracking every LLM invocation (model, tokens, cost, duration). Dedicated `/analytics` page with stat cards, per-model usage table, and 30-day bar chart. Usage overview section in settings. Persistent sidebar (AppShell + AppSidebar) across all pages with navigation footer. Settings page TOC with IntersectionObserver highlighting. Formatting utilities (cost, tokens, relative time).
- 004-thread-routing-and-ui: Thread-level selection and editing (tab bar in edit panel, one thread at a time). Per-thread input source routing via `inputSources` schema field (seed, step, or specific thread). Split button opens ToolPickerModal to choose thread type. Portal-based tooltips (no overflow clipping). Unified scroll container for seed box + pipeline. Collapsible seed box (auto-collapses on step selection). InputSourcePicker component for configuring upstream data flow.
- 003-pipes-and-onboarding: New intent-based node taxonomy (Research, Analyze, Generate, Transform), 7 starter pipes, AI-powered pipeline suggestion via OpenRouter, PipePickerModal + SeedModal onboarding flow, createFromPipe atomic mutation.
- 002-convex-migration: Migrated from SQLite + Zustand persistence to Convex. Deleted all 16 API routes, SQLite infra, and persistent Zustand stores. Added AES-256-GCM encrypted API key storage. Real-time reactive UI via Convex useQuery replaces SSE streaming.
- 001-phase1-core-mvp: Added TypeScript 5.x (strict mode) + Next.js 16, React 19, Zustand, Zod, openai SDK

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
