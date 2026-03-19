---
name: stitch-design
description: "Generate UI designs with Google Stitch AI. Use when the user asks to create UI, design a page, prototype an interface, generate a screen, make a mockup, mentions 'stitch', 'дизайн', 'прототип', 'интерфейс', 'макет', 'экран', or wants AI-generated HTML/Tailwind UI from a text description. Provides a conversational brainstorm-first workflow."
argument-hint: <description or command>
metadata:
  mcp-server: stitch
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

### Step 0: Initialize Workspace & API Key

**API Key check (MANDATORY, always do this first):**
1. Check if `STITCH_API_KEY` environment variable is set (run `echo $STITCH_API_KEY` via Bash)
2. If NOT set — ask the user via AskUserQuestion: "Stitch API key is required. Paste your API key here (get one at https://stitch.withgoogle.com/settings):"
3. When the user provides the key, set it for the current session: `export STITCH_API_KEY="<key>"`
4. **IMPORTANT**: Never log, echo, or display the API key back to the user after receiving it

Also check if Stitch MCP tools are available (look for `generate_screen_from_text` tool). If not available, the MCP server may need a restart after setting the key.

Create the working directory if it doesn't exist:

```bash
mkdir -p ./stitch-design/references
```

Check if `./stitch-design/context-map.md` exists — if yes, read it to understand prior work in this project. Resume from where the user left off if applicable.

Check if `./stitch-design/usage.json` exists — if yes, read it for today's credit usage.

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

**Before generating**, check credit usage:
1. Read `./stitch-design/usage.json`
2. If today's date has entries, show: "Credits used today: X/400. This generation will use ~Y credits. Continue?"
3. If usage > 350, warn: "You're approaching the daily limit (X/400). Continue?"
4. If usage >= 400, block: "Daily limit reached. Try again tomorrow."

**Generate the design:**

1. Create or reuse a Stitch project:
   ```
   create_project(title: "[descriptive project name]")
   ```
   Or if continuing previous work, use existing project ID from `context-map.md`.

2. **If user provided a reference image:**
   ```
   upload_screens_from_images(projectId: "...", images: [...])
   ```
   Then edit the uploaded screen with the composed prompt:
   ```
   edit_screens(projectId: "...", screenIds: ["..."], prompt: "...")
   ```

3. **If generating from text (most common):**

   For a single screen:
   ```
   generate_screen_from_text(projectId: "...", prompt: "...", deviceType: "DESKTOP")
   ```

   For multiple variants:
   ```
   generate_screen_from_text(projectId: "...", prompt: "...", deviceType: "DESKTOP")
   ```
   Then:
   ```
   generate_variants(projectId: "...", screenIds: ["..."], prompt: "try different variations", variantCount: 3, creativeRange: "EXPLORE", aspects: ["COLOR_SCHEME", "LAYOUT"])
   ```

4. **Download artifacts** for each screen:
   - Get the screen data which includes HTML and image URLs
   - Use the download script for each artifact:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/<project>/<screenId>/index.html"
   node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/<project>/<screenId>/preview.png"
   ```

5. **Open in browser:**
   ```bash
   open ./stitch-output/<project>/<screenId>/index.html
   ```

6. **Update tracking files:**

   Update `./stitch-design/context-map.md`:
   ```markdown
   ## Project: [name]
   - Project ID: `...`
   - Created: [date]

   ### Screens
   | Screen ID | Type | Prompt | Files | Parent |
   |-----------|------|--------|-------|--------|
   | abc123 | generated | "analytics dashboard..." | stitch-output/.../index.html | — |
   | def456 | variant-1 | color_scheme variation | stitch-output/.../index.html | abc123 |
   ```

   Update `./stitch-design/usage.json`:
   ```json
   { "daily": { "YYYY-MM-DD": { "generations": N, "edits": N, "variants": N, "total": N } }, "limits": { "daily_bonuses": 400, "daily_redesign": 15 } }
   ```

7. **Present results** to the user:
   - List all generated files with paths
   - Brief description of each variant (if multiple)
   - Ask: "Which variant do you like? Want to refine anything?"

### Step 5: Iterate

After showing results, offer next actions:
- **Edit**: "Change the header color to blue" → use `edit_screens` (creates new screen, original preserved)
- **More variants**: "Show me 3 more with different layouts" → use `generate_variants`
- **Extract theme**: "Give me the Tailwind config from this design" → invoke stitch-theme skill
- **New screen**: "Now design the settings page in the same style" → back to Step 3 with style context preserved
- **Apply design system**: For consistent styling across multiple screens → use `create_design_system` + `apply_design_system`

Each iteration:
- Updates `prompts.md` with the new prompt
- Updates `context-map.md` with new screen entries and parent relationships
- Updates `usage.json` with credit usage
- Downloads new artifacts and opens in browser

## MCP Tools Reference (Quick)

| Tool | Use For |
|------|---------|
| `create_project` | Start a new design project |
| `list_projects` | Find existing projects |
| `generate_screen_from_text` | Generate screen from text prompt |
| `generate_variants` | Create N variations of existing screen |
| `edit_screens` | Modify existing screen (creates new, preserves original) |
| `upload_screens_from_images` | Upload wireframe/screenshot as starting point |
| `get_screen` | Get screen data (HTML/image URLs) |
| `list_screens` | List all screens in a project |
| `create_design_system` | Create a reusable design system |
| `apply_design_system` | Apply design system to screens |
| `list_design_systems` | List available design systems |

## Parameters Reference

**DeviceType**: `MOBILE` | `DESKTOP` | `TABLET` | `AGNOSTIC`

**CreativeRange**: `REFINE` (subtle) | `EXPLORE` (moderate) | `REIMAGINE` (radical)

**VariantAspect**: `LAYOUT` | `COLOR_SCHEME` | `IMAGES` | `TEXT_FONT` | `TEXT_CONTENT`

## Examples

### Example 1: Full brainstorm flow

User: `/stitch-design`

1. Ask what they want to build
2. User describes habit tracking app with gamification
3. Brainstorm: discuss key screens, audience, style preferences
4. Save requirements, collect parameters (MOBILE, playful, 3 variants, EXPLORE)
5. Compose prompt, show for approval
6. Generate 3 variants, download, open in browser
7. User picks favorite, asks for edit → iterate

### Example 2: Quick generation with reference

User: `/stitch-design dark dashboard like Linear [attaches screenshot]`

1. Skip brainstorm — intent is clear
2. Confirm: DESKTOP, minimalist/dark, 3 variants?
3. Upload reference image to Stitch
4. Compose prompt incorporating Linear-style description
5. Generate, download, open in browser

### Example 3: Continuing previous work

User: `/stitch-design` (in a project with existing stitch-design/ folder)

1. Read context-map.md → "I see you have 3 screens from yesterday's dashboard project. Want to continue working on it or start something new?"
2. User: "Add a settings page matching the same style"
3. Use existing project ID, reference the style from previous screens
4. Generate, iterate

## Error Handling

| Error | Action |
|-------|--------|
| `AUTH_FAILED` | Ask the user to provide the API key again — it may be invalid or expired |
| `RATE_LIMITED` | "Daily limit reached. Credits reset tomorrow." Update usage.json. |
| `NETWORK_ERROR` | Retry once after 5 seconds. If still failing, report to user. |
| `VALIDATION_ERROR` | Simplify the prompt (too long or contains unsupported content) |
| MCP tools not found | Ask user for API key, set it via export, suggest restarting Claude Code if MCP still unavailable |
| Download script fails | Check URL validity, try re-fetching screen data with `get_screen` |

## Important Notes

- Stitch generates **self-contained HTML** with inline Tailwind CSS — no build step needed, opens directly in browser
- Each `edit_screens` call creates a **new** screen — the original is never modified
- `generate_variants` consumes 1 credit per variant (3 variants = 3 credits)
- Generation can take up to 60 seconds — inform the user it's working
- HTML includes Google Fonts links and Material Symbols — requires internet to render correctly
- All prompts are in the language the user speaks — Stitch handles both English and Russian well
