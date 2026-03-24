# Changelog

## 2026-03-23 20:20 — `29e99fb` feat: credit indicator fix, rerun from step, and output history

**007 — Credit Fix + Rerun From Step + Output History**

Three shipped features addressing pipeline reliability and output management.

**Summary:**
- Phase 1 (Credit Indicator Fix): `checkCredits` now calls `/api/v1/credits` (account balance) first and falls back to `/api/v1/auth/key` (per-key limit) on error. Returns `balanceSource: 'credits' | 'key_limit' | 'usage_only'`. `CreditIndicator` shows `$X.XX remaining` for known balances or `$X.XX used` with neutral styling for unknown balance — never shows "unlimited". 402 thread errors are enriched with a link to openrouter.ai/settings/credits.
- Phase 2 (Rerun From Step): New `rerunFromStep` mutation resets the target step and all downstream steps/threads to idle and creates a new pipeline run. `runPipeline` action gains optional `fromStepIndex` arg with pre-population of outputs from already-completed steps (fully backward-compatible). `usePipelineStream` gains `rerunFromStep` method. `StepCard` shows a refresh icon on done steps and a "Retry from here" button inside the red error box on failed steps.
- Phase 3 (Output History): New `threadRuns` table records every thread execution (input, output, status, cost, duration). `activeThreadRunId` field on `stepThreads` tracks which run is displayed. `selectAsActive` mutation lets users switch which run feeds downstream. `RightPanel` shows numbered run selector pills under each thread output — clicking a past run restores it.

**Files touched:**
- Modified: `convex/settings/actions.ts`, `convex/pipeline/actions.ts`, `convex/pipeline/mutations.ts`, `convex/schema.ts`, `convex/_generated/api.d.ts`
- Created: `convex/threadRuns/mutations.ts`, `convex/threadRuns/queries.ts`
- Modified: `src/components/layout/credit-indicator.tsx`, `src/components/layout/right-panel.tsx`, `src/components/pipeline/step-card.tsx`, `src/components/pipeline/pipeline-view.tsx`, `src/hooks/use-pipeline-stream.ts`, `src/app/page.tsx`

## 2026-03-23 — `8b64f6a` feat: provider-grouped model catalog, wired defaults, and API key gate

**006-model-catalog-and-api-gate — Model System Overhaul**

Replaced the 3-tier model system (Light/Research/Deep) with a curated provider-grouped catalog and wired the default model setting into all pipeline creation paths. Added a full-page API key gate that blocks the main UI until an OpenRouter key is saved.

**Summary:**
- New `src/config/model-catalog.ts` — 14 curated models across 5 providers (Anthropic, OpenAI, Google, xAI, Perplexity), each tagged with a role (fast, flagship, reasoning, code). Helpers: `getDefaultModel()`, `getAllCuratedModels()`, `findModel()`
- Deleted `src/config/model-tiers.ts` — tier system with matchTierModels/computeTierPricing removed entirely
- Removed `suggestedModels` from `NodeTypeDefinition` type and all 6 node type definitions in `providers.ts`
- Removed all hardcoded `model:` fields from 14 threads across 7 starter pipes in `starter-pipes.ts`
- Rewrote `TierPicker` — provider tab chips (Anthropic/OpenAI/Google/xAI/Perplexity) + role-badged model rows + "Pick specific model" escape hatch to full OpenRouter search
- Rewrote `DefaultModels` settings panel — `<optgroup>`-grouped dropdown from MODEL_CATALOG; removed stale `TEXT_MODELS`/`IMAGE_MODELS` arrays
- `convex/pipeline/suggest.ts` — reads `default_text_model` setting for step model fallback; uses haiku for the suggestion call itself
- `convex/ideas/mutations.ts` — `createFromPipe` accepts optional `defaultModel` arg; threads with no model inherit it
- `src/components/queue/queue-list.tsx` — passes saved default model setting to `createFromPipe`
- `src/app/page.tsx` — API key gate: calls `hasApiKey` query; if false shows setup screen with heading, OpenRouter explanation, `ApiKeyForm`, billing tip, and account creation link; gate disappears reactively when key is saved

**Files touched:**
- Created: `src/config/model-catalog.ts`
- Deleted: `src/config/model-tiers.ts`
- Modified: `src/config/providers.ts`, `src/config/starter-pipes.ts`, `src/components/pipeline/tier-picker.tsx`, `src/components/settings/default-models.tsx`, `convex/pipeline/suggest.ts`, `convex/ideas/mutations.ts`, `src/components/queue/queue-list.tsx`, `src/app/page.tsx`

## 2026-03-22 18:50 — `5e0bd9f` feat: migrate from SQLite/Zustand to Convex

**Convex Migration — Full Backend Replacement**

Replaced SQLite (`better-sqlite3`) + Zustand persistence + 16 Next.js API routes with Convex as the sole database and backend. The app now uses Convex reactive queries for real-time UI updates instead of SSE streaming and manual fetch calls.

**Summary:**
- Added Convex schema with 7 tables: `ideas`, `pipelineSteps`, `stepThreads`, `pipelineTemplates`, `settings`, `logs`, `pipelineRuns`
- Moved pipeline execution engine from `src/lib/pipeline/engine.ts` to `convex/pipeline/actions.ts`
- Added AES-256-GCM encrypted API key storage — keys are never returned to the client in plaintext
- Replaced all `fetch('/api/...')` calls with Convex `useQuery`/`useMutation`/`useAction` hooks
- Added `ConvexClientProvider` to layout, created ephemeral `ui-store.ts` for `activeIdeaId` and `connectionStatus`
- Added `archived` status to ideas for soft delete
- Added queue filter tabs (All, Active, Done, Archived) with overflow menu (Archive, Duplicate, Delete)
- Added `duplicate` mutation for cloning ideas
- Removed `better-sqlite3`, `@types/better-sqlite3`, `idb-keyval` dependencies

**Files touched:**
- Created: `convex/` (36 files — schema, queries, mutations, actions, lib)
- Created: `src/components/providers/convex-client-provider.tsx`, `src/stores/ui-store.ts`, `docs/convex-backend.md`
- Modified: 22 component/hook/type files migrated from Zustand/fetch to Convex hooks
- Deleted: `src/app/api/` (16 route files), `src/lib/db/` (7 files), `src/lib/pipeline/engine.ts`, `src/stores/idea-store.ts`, `src/stores/pipeline-store.ts`, `src/stores/settings-store.ts`, `src/components/providers/store-hydration-provider.tsx`, `tests/unit/pipeline/engine.test.ts`
