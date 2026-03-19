---
name: stitch-design
description: Generate UI designs with Google Stitch AI. Use when user asks to create UI, design a page, prototype an interface, generate a screen, make a mockup, or mentions stitch or design prototyping. Conversational brainstorm-first workflow.
---

# Stitch Design — Conversational UI Generation

## Overview

This skill orchestrates Google Stitch AI to generate UI designs through a conversational workflow. Instead of sending raw prompts to Stitch, it guides the user through brainstorming, parameter selection, and iterative refinement — then composes optimal prompts and manages all artifacts locally.

**Output**: Self-contained HTML files (inline Tailwind CSS, Google Fonts, Material Symbols) that open directly in a browser, plus PNG screenshots.

## Prerequisites

- Node.js 20+ must be available (for download script)
- Google Stitch API key is required

## Workflow

**Follow these steps in order. Do not skip steps.**

### Step 0: Initialize Workspace, API Key & Project

**API Key check (MANDATORY, always do this first):**
1. Check if `STITCH_API_KEY` environment variable is set (run `echo $STITCH_API_KEY` via Bash)
2. If NOT set — ask the user via AskUserQuestion: "Stitch API key is required. Paste your API key (get one at https://stitch.withgoogle.com/settings):"
3. When the user provides the key, do THREE things automatically:
   a. Save to shell profile: `node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-key.mjs "<key>"`
   b. Set for current session: `export STITCH_API_KEY="<key>"`
   c. Source profile to apply: `source ~/.zshrc`
4. **IMPORTANT**: Never log, echo, or display the API key back to the user after receiving it
5. Tell the user: "Key saved to ~/.zshrc. MCP server will connect on next session start."

**Workspace init:**
```bash
mkdir -p ./stitch-design/references
```

**Project management (critical — prevents duplicate projects):**
1. Read `./stitch-design/context-map.md` — if it exists, extract the active project ID
2. **Health-check**: call `list_projects` (fast read-only call)
   - If this call fails → warn user about MCP connection problem, do NOT proceed to generation
   - If succeeds → connection is good, continue
3. If context-map has an active project ID → **reuse it, NEVER create a new project**
4. If no active project → you will create one in Step 4, but not yet

**RULE: Never create a new project when retrying or re-generating. Always reuse the project ID from context-map.md.**

Read `./stitch-design/usage.json` if it exists — check today's credit usage.

### Step 1: Brainstorm & References (Optional)

Determine the user's intent from their input:

**If the user gave a vague description** (e.g., "make me a cool app", "I need a dashboard"):
- Help them refine the idea through questions:
  - "What's the purpose of this screen? Who will use it?"
  - "What are the key elements you need? (navigation, cards, tables, forms...)"
  - "Any apps or websites that inspire you? (you can share a link, screenshot, or just describe the style)"
- Iterate until you have a clear design brief
- Save the brief to `./stitch-design/design-requirements.md`

**If the user gave a specific description** (e.g., "dark analytics dashboard with sales charts"):
- Skip brainstorming, proceed to Step 2

**If the user said "no brainstorm"** or similar:
- Skip immediately to Step 2

**References** — the user may provide:
- **Image file** (screenshot, wireframe, sketch) → save to `./stitch-design/references/`, use in Step 4 via `upload_screens_from_images`
- **URL** → analyze the site (describe the style, layout, key patterns)
- **HTML code** (e.g., from a previous Stitch variant) → analyze the style
- **Text description** ("like Linear", "Notion-style") → incorporate into the prompt

Note all references in `./stitch-design/design-requirements.md`.

### Step 2: Collect Parameters

Ask the user using AskUserQuestion for the following parameters. Provide sensible defaults and explain options briefly.

**Required:**
- **Device type**: DESKTOP / MOBILE / TABLET (default: DESKTOP)
- **Style direction**: minimalist / corporate / bold-vibrant / playful / dark / etc.

**Optional (suggest defaults):**
- **Number of variants**: 1-5 (recommend 3 for exploration, 1 for quick iteration)
- **Creative range**: REFINE (minimal changes) / EXPLORE (moderate variations, recommended) / REIMAGINE (radical alternatives)
- **Variant aspects** (what to vary): LAYOUT / COLOR_SCHEME / IMAGES / TEXT_FONT / TEXT_CONTENT

If the user provides all this information upfront, skip asking and confirm the parameters.

### Step 3: Compose Prompt

Compile all context into an optimized prompt for Stitch:
- Design requirements from Step 1
- Style parameters from Step 2
- Reference descriptions (if any)
- Device-specific considerations

**Prompt composition guidelines:**
- Be specific about layout structure (sidebar, header, grid, cards, etc.)
- Include color/mood keywords (dark theme, vibrant, muted, corporate blue)
- Mention specific UI patterns (data tables, chart widgets, user avatars)
- Reference the target platform (web app, mobile app, landing page)
- Keep the prompt under 500 words — Stitch works best with focused descriptions

**Show the composed prompt to the user** for approval. Let them adjust before sending.

Save the prompt to `./stitch-design/prompts.md` with a timestamp:

```markdown
## [DATE] - [Screen Name]
**Parameters**: device=DESKTOP, variants=3, range=EXPLORE
**Prompt**:
> [the actual prompt sent to Stitch]
```

### Step 4: Generate & Display

#### 4.1 Credit Check

1. Read `./stitch-design/usage.json`
2. If today's date has entries, show: "Credits used today: X/400."
3. If usage > 350, warn: "Approaching daily limit (X/400)."
4. If usage >= 400, block: "Daily limit reached. Try again tomorrow."

#### 4.2 Project Setup

1. If active project ID exists (from Step 0) → use it
2. If no project → create one:
   ```
   create_project(title: "[descriptive project name]")
   ```
   **IMMEDIATELY** write the project ID to `./stitch-design/context-map.md` BEFORE generating anything. This prevents duplicate projects on retry.

#### 4.3 Generation (Fire-and-Poll Protocol)

Tell the user: **"Generating design (~1 min)..."**

**For text-based generation:**
```
generate_screen_from_text(projectId: "...", prompt: "...", deviceType: "DESKTOP")
```

**For reference image:**
```
upload_screens_from_images(projectId: "...", images: [...])
```
Then optionally: `edit_screens(projectId: "...", screenIds: ["..."], prompt: "...")`

**For variants** (after initial screen exists):
```
generate_variants(projectId: "...", screenIds: ["..."], prompt: "...", variantCount: 3, creativeRange: "EXPLORE", aspects: ["COLOR_SCHEME", "LAYOUT"])
```

**If the call succeeds** → proceed to 4.4 Download.

**If ECONNRESET / timeout / fetch failed:**
1. Tell user: "Connection reset — checking if generation completed server-side..."
2. Wait 90 seconds (use `sleep 90` via Bash)
3. Call `list_screens(projectId)` — check for new screens
4. If new screen found → proceed to 4.4 Download
5. If not found → tell user: "Still processing, checking again..."
6. Wait 60 more seconds, call `list_screens` again
7. If found → proceed to 4.4 Download
8. If not found → tell user: "Generation didn't complete. Retry? (attempt X/2)"
9. **Max 2 retry attempts. ALWAYS use the same projectId.**
10. After 2 failed retries → stop, report to user, suggest checking connection.

#### 4.4 Download Artifacts

Use human-readable paths derived from project title and screen context:

```
./stitch-output/{project-slug}/{screen-slug}/index.html
./stitch-output/{project-slug}/{screen-slug}/preview.png
```

Slug rules:
- Project title "Mentoring Booking" → `mentoring-booking`
- Screen context "calendar view" → `calendar-view`
- Edits: `{screen-slug}-edit-1/`, `-edit-2/`, etc.
- Variants: `{screen-slug}-variant-1/`, `-variant-2/`, etc.

Download each artifact:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/{project-slug}/{screen-slug}/index.html"
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/{project-slug}/{screen-slug}/preview.png"
```

Open in browser:
```bash
open ./stitch-output/{project-slug}/{screen-slug}/index.html
```

#### 4.5 Post-Generation (MANDATORY — do not skip any of these)

1. **Inline preview**: Read the downloaded PNG file using the Read tool — it displays the image inline in the chat. The user sees the result without switching to a browser.

2. **Update context-map.md** (upsert — do not duplicate entries):
   ```markdown
   ## Project: [name]
   - Project ID: `...`
   - Created: [date]

   ### Screens
   | Screen ID | Type | Description | Files | Parent |
   |-----------|------|-------------|-------|--------|
   | abc123 | generated | analytics dashboard | stitch-output/.../index.html | — |
   | def456 | variant-1 | color variation | stitch-output/.../index.html | abc123 |
   ```

3. **Update prompts.md** — append the sent prompt with timestamp and parameters.

4. **Update usage.json** — increment the counter for today:
   ```json
   { "daily": { "YYYY-MM-DD": { "generations": N, "edits": N, "variants": N, "total": N } }, "limits": { "daily_bonuses": 400, "daily_redesign": 15 } }
   ```

5. **Show structured result to user:**
   - Inline preview image (already shown in step 1)
   - File paths
   - Brief description: what's on the screen
   - Next steps: "Refine? More variants? Extract theme?"

### Step 5: Iterate

After showing results, offer next actions:
- **Edit**: "Change the header color to blue" → use `edit_screens` (creates new screen, original preserved)
- **More variants**: "Show me 3 more with different layouts" → use `generate_variants`
- **Extract theme**: "Give me the Tailwind config from this design" → invoke stitch-theme skill
- **New screen**: "Now design the settings page in the same style" → back to Step 3 with style context preserved
- **Apply design system**: For consistent styling across multiple screens → use `create_design_system` + `apply_design_system`

Each iteration follows the same fire-and-poll protocol (4.3) and mandatory post-generation steps (4.5).

## Idempotency Rules

Every operation in this skill must be safe to repeat:
- `create_project` when active project exists → skip, return existing ID
- `download` when file exists → overwrite silently (no error)
- `context-map.md` writes → upsert by screen ID, never create duplicate entries
- `usage.json` writes → increment, not overwrite

## MCP Tools Reference

| Tool | Use For |
|------|---------|
| `create_project` | Start a new design project |
| `list_projects` | Find existing projects / health-check |
| `generate_screen_from_text` | Generate screen from text prompt |
| `generate_variants` | Create N variations of existing screen |
| `edit_screens` | Modify existing screen (creates new, preserves original) |
| `upload_screens_from_images` | Upload wireframe/screenshot as starting point |
| `get_screen` | Get screen data (HTML/image URLs) |
| `list_screens` | List screens in project / poll for completed generation |

## Parameters Reference

**DeviceType**: `MOBILE` | `DESKTOP` | `TABLET` | `AGNOSTIC`

**CreativeRange**: `REFINE` (subtle) | `EXPLORE` (moderate) | `REIMAGINE` (radical)

**VariantAspect**: `LAYOUT` | `COLOR_SCHEME` | `IMAGES` | `TEXT_FONT` | `TEXT_CONTENT`

## Error Handling

**ECONNRESET / timeout / fetch failed during generation:**
→ Use fire-and-poll protocol (Step 4.3). The generation usually completes server-side despite the connection reset.

**All MCP calls failing (including fast ones like list_projects):**
1. Ask user to verify STITCH_API_KEY is set correctly
2. Suggest restarting Claude Code session
3. DO NOT attempt workarounds via curl, SDK scripts, or inline code — these are dead ends

**Max retries**: 2 for any generation/edit/variant operation. After 2 failures → stop and report.

## Known Issues

`generate_screen_from_text`, `edit_screens`, and `generate_variants` may timeout via the MCP proxy with ECONNRESET after ~60 seconds. This is a transport-layer limitation of the stdio proxy, not a Stitch API error. The generation almost always completes server-side despite the connection reset. The fire-and-poll protocol in Step 4.3 handles this by checking `list_screens` after a timeout to find the completed result.

## Examples

### Example 1: Full brainstorm flow

User: `/stitch-design`

1. Ask what they want to build
2. User describes habit tracking app with gamification
3. Brainstorm: discuss key screens, audience, style preferences
4. Save requirements, collect parameters (MOBILE, playful, 3 variants, EXPLORE)
5. Compose prompt, show for approval
6. Generate 3 variants, download, show inline preview
7. User picks favorite, asks for edit → iterate

### Example 2: Quick generation with reference

User: `/stitch-design dark dashboard like Linear [attaches screenshot]`

1. Skip brainstorm — intent is clear
2. Confirm: DESKTOP, minimalist/dark, 3 variants?
3. Upload reference image to Stitch
4. Compose prompt incorporating Linear-style description
5. Generate, download, show inline preview

### Example 3: Continuing previous work

User: `/stitch-design` (in a project with existing stitch-design/ folder)

1. Read context-map.md → "I see you have 3 screens from yesterday's dashboard project. Want to continue working on it or start something new?"
2. User: "Add a settings page matching the same style"
3. Use existing project ID, reference the style from previous screens
4. Generate, show inline preview, iterate
