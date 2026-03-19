---
name: stitch-theme
description: Extract design theme from a Stitch-generated HTML file. Use when user asks to extract Tailwind config, fonts, icons, or design tokens from a generated design.
---

# Extract Stitch Theme

## Overview

Parse a Stitch-generated HTML file to extract reusable design artifacts: Tailwind CSS configuration, Google Fonts links, and Material Symbols icon names. These can be integrated directly into your project.

## Prerequisites

- A downloaded Stitch HTML file (from a previous generation)
- Node.js 20+ (for the parser script)

## Workflow

### Step 1: Identify the HTML File

Determine which design to extract from:
- If the user just generated a screen → use that HTML file
- If unclear → check `./stitch-design/context-map.md` for recent screens
- Ask the user which screen to extract from if multiple exist

### Step 2: Run Theme Extractor

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/extract-theme.mjs "./stitch-output/<project>/<screenId>/index.html" --output-dir "./stitch-output/themes"
```

This produces:
- `tailwind.config.extract.js` — Tailwind CSS theme configuration (colors, fonts, spacing)
- `fonts.css` — Google Fonts import statements
- `icons-manifest.json` — list of Material Symbols used in the design

### Step 3: Present Results

Show the user what was extracted:
- Key colors from the Tailwind config
- Font families
- Icon names

### Step 4: Integration Guidance

Suggest how to use the extracted theme in their project:
- "Copy `tailwind.config.extract.js` values into your existing `tailwind.config.js`"
- "Add the Google Fonts links from `fonts.css` to your HTML head or CSS imports"
- "Install the Material Symbols icons listed in `icons-manifest.json`"

## Output Files

| File | Contents |
|------|----------|
| `tailwind.config.extract.js` | Tailwind theme with colors, fontFamily, extend values |
| `fonts.css` | `@import` statements for Google Fonts |
| `icons-manifest.json` | Array of Material Symbols icon names used |
