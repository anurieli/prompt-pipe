# Analytics System

PromptPipe tracks every LLM invocation with full token and cost accounting. This data powers the analytics page and the usage overview in settings.

## What's Tracked

Every time a pipeline thread executes against a model provider, a `usageRecord` is written with:

| Field | Description |
|-------|-------------|
| `model` | Model identifier (e.g., `anthropic/claude-3.5-sonnet`) |
| `provider` | Provider name (e.g., `openrouter`) |
| `inputTokens` | Number of prompt tokens sent |
| `outputTokens` | Number of completion tokens received |
| `costUsd` | Estimated cost in USD |
| `durationMs` | Request duration in milliseconds |
| `ideaId` | The idea this execution belongs to |
| `stepId` | The pipeline step |
| `threadId` | The specific thread within the step |
| `runId` | The pipeline run |
| `timestamp` | ISO 8601 timestamp of the execution |

Records are only written when the provider returns token usage data. Webhook providers (which don't return token counts) are excluded.

## Why a Separate Table

The `stepThreads` table also stores `tokenUsage` and `costUsd`, but this data gets **wiped on every `resetExecution` call**. The `usageRecords` table preserves the full usage history across pipeline resets and re-runs, making it the source of truth for analytics.

## Data Flow

```
Pipeline action (convex/pipeline/actions.ts)
  → Thread executes via OpenRouter adapter
  → Adapter returns { tokenUsage, costUsd, durationMs }
  → Pipeline writes to stepThreads (ephemeral, reset on re-run)
  → Pipeline writes to usageRecords (persistent, never deleted)
```

## Convex Schema

Table: `usageRecords`

Indexes:
- `by_timestamp` — for time-range queries
- `by_model` — for per-model lookups
- `by_provider` — for per-provider lookups
- `by_ideaId` — for per-idea cost tracking
- `by_runId` — for per-run cost tracking

## Backend Queries

All queries are in `convex/analytics/queries.ts`:

### `getUsageSummary`
- **Args**: none
- **Returns**: Array of per-model aggregates: `{ model, provider, totalRuns, totalInputTokens, totalOutputTokens, totalCostUsd, lastUsedAt }`
- **Behavior**: Groups by model, sorted by cost descending. Only includes models with actual usage.

### `getUsageOverTime`
- **Args**: `{ days: number }`
- **Returns**: Array of daily aggregates: `{ date, totalCostUsd, totalInputTokens, totalOutputTokens, runCount }`
- **Behavior**: Filters to last N days, groups by date, sorted chronologically.

### `getTotalStats`
- **Args**: none
- **Returns**: `{ totalCostUsd, totalInputTokens, totalOutputTokens, totalRuns, uniqueModels }`

## Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AnalyticsPage` | `src/app/analytics/page.tsx` | Page route at `/analytics` |
| `StatCards` | `src/components/analytics/stat-cards.tsx` | 4-card grid: cost, tokens, runs, models |
| `UsageByModel` | `src/components/analytics/usage-by-model.tsx` | Table of per-model usage stats |
| `UsageOverTime` | `src/components/analytics/usage-over-time.tsx` | 30-day bar chart with hover tooltips |
| `UsageOverview` | `src/components/settings/usage-overview.tsx` | Compact summary in settings page |

## Formatting Utilities

Shared formatters in `src/lib/format.ts`:
- `formatCost(usd)` — "$0.0042", "$1.23"
- `formatTokens(count)` — "1,234", "45.2K", "1.2M"
- `formatRelativeTime(iso)` — "2h ago", "3d ago"

## Cost Accuracy

Cost is calculated in the OpenRouter adapter using hardcoded rates:
- Input: $0.000001/token
- Output: $0.000002/token

These are rough defaults. The `listModels()` function fetches actual per-model pricing from OpenRouter, which could be used for more accurate cost tracking in the future.

