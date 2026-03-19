---
name: stitch-upload
description: Upload a wireframe, screenshot, or sketch to Google Stitch for digitization into a clean UI. Use when user provides an image file and asks to convert it to UI or digitize a sketch.
---

# Upload to Stitch

## Overview

Upload an image (wireframe, screenshot, sketch) to Google Stitch to create an editable UI screen from it. The uploaded image serves as a starting point that Stitch interprets and converts into clean HTML with Tailwind CSS.

## Prerequisites

- Stitch MCP tools must be available
- User must provide an image file (PNG, JPG, etc.)

## Workflow

### Step 1: Prepare Image

Identify the image the user wants to upload:
- If the user attached a file → use that path directly
- If the user described an image → ask them to provide the file path

Save a copy to `./stitch-design/references/` for tracking.

### Step 2: Get Context (Optional)

Ask the user:
- "What style should the final UI be? (clean, Material Design, minimalist...)"
- "Any specific changes from the original? (different colors, add elements...)"
- "Device type?" (DESKTOP / MOBILE / TABLET)

### Step 3: Project Setup & Upload (Fire-and-Poll Protocol)

**Project management:**
1. Read `./stitch-design/context-map.md` — check for active project
2. If active project exists → reuse it, never create a new one
3. If no project → `create_project`, **IMMEDIATELY** write ID to context-map.md before upload

Tell the user: **"Uploading and processing image (~1 min)..."**

```
upload_screens_from_images(projectId: "...", images: [{ filePath: "<path>", mimeType: "image/png" }])
```

**If the call succeeds** → proceed to Step 4.

**If ECONNRESET / timeout / fetch failed:**
1. Tell user: "Connection reset — checking if upload completed server-side..."
2. Wait 90 seconds
3. Call `list_screens(projectId)` — check for new screens
4. If new screen found → proceed to Step 4
5. If not found → wait 60 more seconds, poll again
6. If found → Step 4
7. If not found → "Upload didn't complete. Retry? (attempt X/2)"
8. **Max 2 retries. Always use the same projectId.**

### Step 4: Refine (Optional)

If the user wants modifications from the original, use edit with the same fire-and-poll protocol:
```
edit_screens(projectId: "...", screenIds: ["<screenId>"], prompt: "<refinement prompt>")
```

### Step 5: Download & Display

Use human-readable paths:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/{project-slug}/{screen-slug}/index.html"
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/{project-slug}/{screen-slug}/preview.png"
```

**Inline preview**: Read the PNG file via Read tool — displays the image inline in chat.

Open in browser:
```bash
open ./stitch-output/{project-slug}/{screen-slug}/index.html
```

### Step 6: Update Tracking (MANDATORY — do not skip)

1. **context-map.md** — add screen entry with reference to uploaded image (upsert by screen ID)
2. **prompts.md** — log the upload context and any refinement prompts
3. **usage.json** — increment upload counter for today

### Step 7: Offer Next Steps

- "Edit the design further?"
- "Generate variants?"
- "Upload another image?"

## Error Handling

**ECONNRESET / timeout**: Use fire-and-poll protocol (Step 3). The upload usually completes server-side.

**All MCP calls failing**: Ask user to check API key and restart Claude Code. Do not attempt workarounds.

**Max retries**: 2 per upload/edit operation.
