---
name: stitch-upload
description: "Upload a wireframe, screenshot, or sketch to Google Stitch for digitization into a clean UI. Use when the user provides an image file and asks to convert it to UI, digitize a sketch, recreate from screenshot — e.g., 'turn this wireframe into UI', 'digitize this sketch', 'recreate this screenshot', 'вот скриншот, сделай UI'."
metadata:
  mcp-server: stitch
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

### Step 3: Upload to Stitch

Create or reuse a project, then upload:

```
upload_screens_from_images(projectId: "...", images: [{ filePath: "<path>", mimeType: "image/png" }])
```

This returns a Screen object based on the uploaded image.

### Step 4: Refine (Optional)

If the user wants modifications from the original:
```
edit_screens(projectId: "...", screenIds: ["<screenId>"], prompt: "<refinement prompt>")
```

### Step 5: Download & Display

Download artifacts and open in browser:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<html-url>" "./stitch-output/<project>/<screenId>/index.html"
node ${CLAUDE_PLUGIN_ROOT}/scripts/download.mjs "<image-url>" "./stitch-output/<project>/<screenId>/preview.png"
open ./stitch-output/<project>/<screenId>/index.html
```

### Step 6: Update Tracking

Update `context-map.md`, `prompts.md`, and `usage.json`.

Note the reference image source in the context map.

### Step 7: Offer Next Steps

- "Edit the design further?"
- "Generate variants?"
- "Upload another image?"
