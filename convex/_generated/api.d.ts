/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics_mutations from "../analytics/mutations.js";
import type * as analytics_queries from "../analytics/queries.js";
import type * as export_queries from "../export/queries.js";
import type * as ideas_internalMutations from "../ideas/internalMutations.js";
import type * as ideas_mutations from "../ideas/mutations.js";
import type * as ideas_queries from "../ideas/queries.js";
import type * as lib_providers_openrouterAdapter from "../lib/providers/openrouterAdapter.js";
import type * as lib_providers_webhookAdapter from "../lib/providers/webhookAdapter.js";
import type * as lib_typeChecker from "../lib/typeChecker.js";
import type * as lib_variableResolver from "../lib/variableResolver.js";
import type * as logs_mutations from "../logs/mutations.js";
import type * as logs_queries from "../logs/queries.js";
import type * as models_actions from "../models/actions.js";
import type * as pipeline_actions from "../pipeline/actions.js";
import type * as pipeline_mutations from "../pipeline/mutations.js";
import type * as pipeline_queries from "../pipeline/queries.js";
import type * as pipeline_suggest from "../pipeline/suggest.js";
import type * as settings_actions from "../settings/actions.js";
import type * as settings_encryption from "../settings/encryption.js";
import type * as settings_internalQueries from "../settings/internalQueries.js";
import type * as settings_mask from "../settings/mask.js";
import type * as settings_mutations from "../settings/mutations.js";
import type * as settings_queries from "../settings/queries.js";
import type * as steps_internalMutations from "../steps/internalMutations.js";
import type * as steps_mutations from "../steps/mutations.js";
import type * as steps_queries from "../steps/queries.js";
import type * as threadRuns_mutations from "../threadRuns/mutations.js";
import type * as threadRuns_queries from "../threadRuns/queries.js";
import type * as threads_internalMutations from "../threads/internalMutations.js";
import type * as threads_mutations from "../threads/mutations.js";
import type * as threads_queries from "../threads/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "analytics/mutations": typeof analytics_mutations;
  "analytics/queries": typeof analytics_queries;
  "export/queries": typeof export_queries;
  "ideas/internalMutations": typeof ideas_internalMutations;
  "ideas/mutations": typeof ideas_mutations;
  "ideas/queries": typeof ideas_queries;
  "lib/providers/openrouterAdapter": typeof lib_providers_openrouterAdapter;
  "lib/providers/webhookAdapter": typeof lib_providers_webhookAdapter;
  "lib/typeChecker": typeof lib_typeChecker;
  "lib/variableResolver": typeof lib_variableResolver;
  "logs/mutations": typeof logs_mutations;
  "logs/queries": typeof logs_queries;
  "models/actions": typeof models_actions;
  "pipeline/actions": typeof pipeline_actions;
  "pipeline/mutations": typeof pipeline_mutations;
  "pipeline/queries": typeof pipeline_queries;
  "pipeline/suggest": typeof pipeline_suggest;
  "settings/actions": typeof settings_actions;
  "settings/encryption": typeof settings_encryption;
  "settings/internalQueries": typeof settings_internalQueries;
  "settings/mask": typeof settings_mask;
  "settings/mutations": typeof settings_mutations;
  "settings/queries": typeof settings_queries;
  "steps/internalMutations": typeof steps_internalMutations;
  "steps/mutations": typeof steps_mutations;
  "steps/queries": typeof steps_queries;
  "threadRuns/mutations": typeof threadRuns_mutations;
  "threadRuns/queries": typeof threadRuns_queries;
  "threads/internalMutations": typeof threads_internalMutations;
  "threads/mutations": typeof threads_mutations;
  "threads/queries": typeof threads_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
