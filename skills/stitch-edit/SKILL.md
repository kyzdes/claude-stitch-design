---
name: stitch-edit
description: "Edit an existing Stitch UI design. Use when the user asks to modify, change, update, or refine an existing screen design — e.g., 'change the header', 'add a sidebar', 'make it darker', 'move the button', 'измени дизайн', 'отредактируй экран'. Requires an active Stitch project context."
metadata:
  mcp-server: stitch
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
- If the user just generated a screen in this session → use that screen ID
- If the user specifies a screen ID → use it
- If unclear → read `./stitch-design/context-map.md` and ask which screen to edit

### Step 2: Compose Edit Prompt

Take the user's description of changes and compose a clear edit prompt. Be specific:
- "Change the header background to dark blue and increase font size of the title"
- NOT "make it look better" (too vague for good results)

If the user is vague, help them be specific: "What exactly would you like to change? Color, layout, adding elements, removing elements?"

### Step 3: Execute Edit

```
edit_screens(projectId: "...", screenIds: ["<screenId>"], prompt: "<edit prompt>", deviceType: "DESKTOP")
```

**Important**: This creates a NEW screen. The original screen is preserved.

### Step 4: Download & Display

Download the new screen's HTML and PNG:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/<project>/<newScreenId>/index.html"
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/<project>/<newScreenId>/preview.png"
```

Open in browser:
```bash
open ./stitch-output/<project>/<newScreenId>/index.html
```

### Step 5: Update Tracking

Update `./stitch-design/context-map.md` — add the new screen with parent reference to the original.

Update `./stitch-design/prompts.md` — log the edit prompt.

Update `./stitch-design/usage.json` — increment edit counter for today.

### Step 6: Offer Next Steps

- "Want to make more changes?"
- "Generate variants of this version?"
- "Extract the theme (Tailwind config, fonts)?"

## Error Handling

| Error | Action |
|-------|--------|
| Screen not found | Check context-map.md, ask user for correct screen ID |
| Edit fails | Simplify the prompt, try again |
| RATE_LIMITED | Inform user, update usage.json |
