# PromptPipe Deep E2E Test Plan

> For agents running browser automation against `http://localhost:3000`.
> Prerequisites: Both `npm run dev` and `npx convex dev` must be running.
> An OpenRouter API key must be saved in Settings.

---

## Test Suite 1: Input Source Routing (Parent Prompt Selection)

Tests the `inputSources` feature — each thread can pull input from different upstream sources.

### 1A. Default chaining (seed → step 1 → step 2)

1. Create a new idea from scratch
2. Enter seed: "List 5 programming languages"
3. Add a Research step (step 1), select Haiku 4.5
4. Add a Generate step (step 2), leave input source as "Previous step output (default)"
5. Run pipeline
6. **Verify**: Step 2's input should be step 1's output (not the raw seed)
7. Check the EDIT tab for step 2 — input source should say "Previous step output"

### 1B. Skip-connection (step 2 reads from seed, not step 1)

1. Using the same idea from 1A, click step 2 in the pipeline
2. In EDIT tab, find "INPUT SOURCE" and click "change source"
3. Change input source to "Seed (original prompt)"
4. Run pipeline again
5. **Verify**: Step 2's output should now respond to "List 5 programming languages" directly, NOT to step 1's research output
6. Compare outputs — they should be meaningfully different

### 1C. Cross-step reference (step 3 reads from step 1, skipping step 2)

1. Add a Transform step (step 3)
2. In EDIT tab for step 3, change input source to "Step 1: Research Step" output
3. Set model to Haiku 4.5
4. Run pipeline
5. **Verify**: Step 3 processes step 1's output, not step 2's

### 1D. Per-thread input sources (different threads on same step, different inputs)

1. Click the split button on step 1 to add a second thread (Analyze type)
2. Set the new Analyze Thread's input source to "Seed (original prompt)"
3. Keep the original Research Thread's input source as "Seed" too
4. Run pipeline
5. **Verify**: Both threads on step 1 get the seed, but produce different outputs (research vs analysis)

---

## Test Suite 2: Model Selection and Provider Switching

### 2A. All provider tabs render models

For each provider tab (Anthropic, OpenAI, Google, xAI, Perplexity):
1. Click a step, go to EDIT tab
2. Click each provider tab
3. **Verify**: Each tab shows models with role badges (FAST, FLAGSHIP, REASONING, CODE)
4. **Verify**: Clicking a model shows a checkmark and the model ID appears on the step card

### 2B. Default model fallback

1. Go to Settings → Default Models
2. Set the default text model (e.g., Haiku 4.5)
3. Create a new idea from scratch
4. Add a Research step — do NOT select a model manually
5. Run the pipeline
6. **Verify**: The step should use the default model, NOT fail with "No models provided"
7. **Note**: If it DOES fail with 400, this confirms Bug #4 (no default model fallback)

### 2C. Model switching mid-pipeline

1. Create an idea with 2 steps
2. Set step 1 to Anthropic Haiku 4.5, step 2 to OpenAI GPT-5.4 Mini
3. Run pipeline
4. **Verify**: Both steps complete, each using their respective model
5. Check Analytics page — both models should appear in Usage by Model table

### 2D. "Pick Specific Model" expansion

1. Click a step, go to EDIT tab
2. Click "PICK SPECIFIC MODEL" to expand it
3. **Verify**: A searchable list of all models for the selected provider appears
4. Select a model from the expanded list
5. **Verify**: Selection persists and is used during execution

---

## Test Suite 3: Image Generation

### 3A. Image output rendering

1. Create a new idea: "A cute cat wearing a top hat"
2. Add a Generate step
3. In EDIT tab, set the model to an image generation model:
   - Try OpenAI → look for DALL-E or similar
   - Or use "PICK SPECIFIC MODEL" and search for image models
4. Change response type to "image" if available in step config
5. Run pipeline
6. **Verify**: Output tab renders an image (not text)
7. **Verify**: The image displays correctly in the MediaOutput component

### 3B. Mixed output (text + images)

1. Create a step that generates text followed by an image reference
2. **Verify**: MediaOutput handles mixed content types correctly
3. Check for any rendering errors in the console

---

## Test Suite 4: Starter Pipes and AI Pipeline Generation

### 4A. Starter pipe creation

1. Click "+ New Idea"
2. Select "Starter Pipes"
3. **Verify**: A grid/list of pre-built pipes appears (Research, Content, Analysis, etc.)
4. Select each starter pipe one at a time
5. **Verify**: Each creates an idea with pre-configured steps, correct node types, and prompts
6. **Verify**: Steps have appropriate models and input source routing

### 4B. AI pipeline generation ("Generate with AI")

1. Click "+ New Idea"
2. Select "Generate with AI"
3. Enter: "I want to research a topic, analyze the findings, and write a blog post about it"
4. **Verify**: AI suggests a pipeline with appropriate steps
5. **Verify**: Generated steps have meaningful names, prompts, and model selections
6. Accept the pipeline
7. **Verify**: All steps render in the pipeline view with correct node types

### 4C. Starter pipe variety

1. Create ideas from ALL available starter pipes
2. For each: run the pipeline with a relevant seed prompt
3. **Verify**: Each pipe produces meaningful output for its intended use case
4. **Verify**: No starter pipe crashes or fails due to misconfiguration

---

## Test Suite 5: Pipeline Execution Edge Cases

### 5A. Empty seed prompt

1. Create idea, leave seed prompt blank
2. Add a Research step with Haiku 4.5
3. Run pipeline
4. **Verify**: Either shows a validation error, or the LLM handles the empty input gracefully
5. Check for console errors

### 5B. Very long seed prompt

1. Create idea with a 2000+ character seed prompt
2. Add one step, run pipeline
3. **Verify**: Character count updates correctly, pipeline executes without truncation issues

### 5C. Pipeline with only one step

1. Create idea with a single Research step
2. Run pipeline
3. **Verify**: Completes successfully, output appears, no errors about missing downstream steps

### 5D. Dry Run

1. Create idea with steps
2. Click "Dry Run" instead of "Run Pipeline"
3. **Verify**: Dry run produces a preview/validation without making API calls
4. **Verify**: No credits are consumed

### 5E. Run during active run

1. Start a pipeline run
2. While it's running, try clicking "Run Pipeline" again
3. **Verify**: The button is disabled or a warning appears — no double-execution

### 5F. Rapid navigation during run

1. Start a pipeline run
2. While running, switch to a different idea in the sidebar
3. Switch back
4. **Verify**: The running pipeline is still executing, status indicators update correctly

---

## Test Suite 6: Tag Management

### 6A. Add tags

1. Click "Add tags..." on an idea
2. Type a tag name and press Enter
3. **Verify**: Tag pill appears with dismiss (×) button

### 6B. Remove tags

1. Click × on a tag
2. **Verify**: Tag is removed immediately

### 6C. Multiple tags

1. Add 5+ tags
2. **Verify**: Tags wrap to new lines if needed, no overflow

---

## Test Suite 7: Keyboard Shortcuts

### 7A. ⌘N — New idea

1. Press ⌘N
2. **Verify**: New Idea modal opens

### 7B. ⌘⇧Enter — Run pipeline (if applicable)

1. With an idea selected, press ⌘⇧Enter
2. **Verify**: Pipeline starts running

### 7C. Escape — Close modals

1. Open any modal (New Idea, Tool Picker, etc.)
2. Press Escape
3. **Verify**: Modal closes

---

## Test Suite 8: Responsive Layout and Overflow

### 8A. Long idea titles

1. Create an idea with a very long title (100+ characters)
2. **Verify**: Title truncates with ellipsis in sidebar, shows full in main area

### 8B. Long step names

1. Rename a step to have a very long name
2. **Verify**: Step card handles overflow correctly

### 8C. Many steps (10+)

1. Add 10+ steps to a single idea
2. **Verify**: Pipeline view scrolls correctly, all steps accessible
3. **Verify**: Step selector dropdown in OUTPUT tab lists all steps

### 8D. Many ideas (20+)

1. Create 20+ ideas
2. **Verify**: Sidebar scrolls, performance doesn't degrade

---

## Test Suite 9: Data Persistence and Real-time Updates

### 9A. Refresh persistence

1. Create an idea, add steps, enter a seed prompt
2. Hard refresh the page (⌘R)
3. **Verify**: All data persists — idea, steps, seed, model selections

### 9B. Real-time updates

1. Open the app in two browser tabs
2. Create an idea in tab 1
3. **Verify**: It appears in tab 2's sidebar automatically (Convex real-time)

### 9C. Settings persistence

1. Change default model in Settings
2. Refresh the page
3. **Verify**: Setting persists

---

## Test Suite 10: Export and Data Management

### 10A. Export settings

1. Go to Settings → Data
2. Click "Export"
3. **Verify**: A JSON file downloads with masked API keys

### 10B. Idea export

1. Open an idea with output
2. Look for an export option (if available)
3. **Verify**: Can export as Markdown or JSON

### 10C. Clear all data

1. Go to Settings → Data → "Clear All"
2. **Verify**: Confirmation dialog appears (destructive action)
3. **Do NOT confirm** — just verify the dialog exists

---

## Reporting Format

For each test, report:
```
[PASS/FAIL/SKIP] Test ID: Brief description
  - What worked
  - What broke (include screenshot ID if possible)
  - Console errors (if any)
  - Severity: critical / major / minor / cosmetic
```
