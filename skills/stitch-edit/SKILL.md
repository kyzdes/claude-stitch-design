---
name: stitch-edit
description: Edit an existing Stitch UI design. Use when user asks to modify, change, update, or refine an existing screen design such as changing headers, adding sidebars, or adjusting colors.
---

# Edit Stitch Design

## Overview

Iteratively edit an existing Stitch screen. Each edit creates a **new** screen — the original is always preserved, giving you a full history of changes.

## Prerequisites

- Stitch MCP tools must be available
- An existing screen to edit (from a previous generation or the current session)
- If screen ID is unknown, check `./stitch-design/context-map.md` for the most recent screen

## Workflow

### Step 1: Identify the Screen

Determine which screen to edit:
- If the user just generated a screen in this session → use that screen ID and project ID
- If the user specifies a screen ID → use it
- If unclear → read `./stitch-design/context-map.md` and ask which screen to edit

Always use the **existing project ID** from context-map.md. Never create a new project for edits.

### Step 2: Compose Edit Prompt

Take the user's description of changes and compose a clear edit prompt. Be specific:
- "Change the header background to dark blue and increase font size of the title"
- NOT "make it look better" (too vague for good results)

If the user is vague, help them be specific: "What exactly would you like to change? Color, layout, adding elements, removing elements?"

### Step 3: Execute Edit (Fire-and-Poll Protocol)

Tell the user: **"Applying changes (~1 min)..."**

```
edit_screens(projectId: "...", screenIds: ["<screenId>"], prompt: "<edit prompt>", deviceType: "DESKTOP")
```

**Important**: This creates a NEW screen. The original screen is preserved.

**If the call succeeds** → proceed to Step 4.

**If ECONNRESET / timeout / fetch failed:**
1. Tell user: "Connection reset — checking if edit completed server-side..."
2. Wait 90 seconds
3. Call `list_screens(projectId)` — look for a new screen that wasn't there before
4. If new screen found → proceed to Step 4
5. If not found → wait 60 more seconds, poll again
6. If found → Step 4
7. If not found → "Edit didn't complete. Retry? (attempt X/2)"
8. **Max 2 retries. Always use the same projectId.**

### Step 4: Download & Display

Use human-readable paths:
```
./stitch-output/{project-slug}/{screen-slug}-edit-N/index.html
./stitch-output/{project-slug}/{screen-slug}-edit-N/preview.png
```

Download artifacts:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/{project-slug}/{screen-slug}-edit-N/index.html"
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/{project-slug}/{screen-slug}-edit-N/preview.png"
```

**Inline preview**: Read the PNG file via Read tool — displays the image inline in chat.

Open in browser:
```bash
open ./stitch-output/{project-slug}/{screen-slug}-edit-N/index.html
```

### Step 5: Update Tracking (MANDATORY — do not skip)

1. **context-map.md** — add the new screen entry with parent reference to the original (upsert by screen ID)
2. **prompts.md** — log the edit prompt with timestamp
3. **usage.json** — increment edit counter for today

### Step 6: Offer Next Steps

- "Want to make more changes?"
- "Generate variants of this version?"
- "Extract the theme (Tailwind config, fonts)?"

## Error Handling

**ECONNRESET / timeout**: Use fire-and-poll protocol (Step 3). The edit usually completes server-side.

**All MCP calls failing**: Ask user to check API key and restart Claude Code. Do not attempt workarounds.

**Max retries**: 2 per edit operation.
