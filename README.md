# Stitch Design — Claude Code Plugin

Generate, edit, and iterate on UI designs from natural language using [Google Stitch AI](https://stitch.withgoogle.com), right inside Claude Code.

> Describe what you want. Get production-ready HTML with Tailwind CSS and a PNG preview. Refine with follow-up prompts.

## What it does

This plugin connects Google Stitch's AI design engine to Claude Code through a conversational workflow:

1. **Brainstorm** the idea through dialogue (optional)
2. **Generate** a UI screen from a text prompt
3. **Preview** the result inline in the chat
4. **Iterate** — edit, create variants, extract theme, apply a design system

Every output is a self-contained HTML file (inline Tailwind CSS, Google Fonts, Material Symbols) that opens directly in a browser.

## Quick start

```bash
# Install the plugin
claude plugin install kyzdes/claude-stitch-design

# Restart Claude Code, then:
/stitch-setup
# Paste your API key (get one at https://stitch.withgoogle.com/settings)
```

That's it. The MCP server connects automatically on next session start.

## Usage examples

### Generate a screen from a description

```
> /stitch-design

> I need a booking page for a mentoring platform — calendar view,
  time slot picker, mentor profile card on the side. Sage and amber palette.
```

Claude brainstorms details, composes an optimized prompt, generates the design, downloads HTML + PNG, and shows an inline preview — all in one conversation.

### Upload a wireframe and digitize it

```
> /stitch-upload

> Here's my hand-drawn wireframe [attaches sketch.png].
  Turn it into a clean Material Design interface, mobile layout.
```

Stitch interprets the sketch and produces a polished HTML screen.

### Edit an existing screen

```
> /stitch-edit

> Make the sidebar collapsible and change the header to dark blue.
```

Each edit creates a new screen — the original is always preserved.

### Generate variants

```
> Show me 3 variants with different color schemes and layouts.
```

Get multiple design directions from a single screen to compare side by side.

### Extract the theme

```
> /stitch-theme
```

Extracts Tailwind config, Google Fonts imports, and Material Symbols icon list from any generated HTML — ready to drop into your project.

## Skills & commands

| Skill / Command | Description |
|---|---|
| `stitch-design` | Full conversational flow: brainstorm, generate, iterate |
| `stitch-edit` | Edit an existing screen with a follow-up prompt |
| `stitch-upload` | Upload a wireframe/screenshot for AI digitization |
| `stitch-theme` | Extract Tailwind config, fonts, and icons from a design |
| `/stitch-setup` | Configure or update the API key |
| `/stitch-reset` | Remove API key and/or clean project files |

## How it works

```
User prompt
    |
    v
Claude Code (orchestrator)
    |
    v
stitch-proxy.mjs (stdio MCP proxy)
    |
    v
stitch.googleapis.com/mcp (Google Stitch API)
    |
    v
HTML + PNG artifacts --> local files + inline preview
```

Stitch doesn't support OAuth for Claude Code's HTTP MCP client, so the plugin runs a lightweight Node.js stdio proxy (`StitchProxy` from the official SDK) that handles API key authentication transparently.

### Output structure

```
./stitch-output/
  mentoring-booking/
    calendar-view/
      index.html          # Self-contained HTML (Tailwind CSS)
      preview.png         # Screenshot
    calendar-view-edit-1/
    calendar-view-variant-1/
    calendar-view-variant-2/
```

### Working files

```
./stitch-design/
  context-map.md          # Project/screen registry (prevents duplicates)
  prompts.md              # Prompt history with timestamps
  usage.json              # Daily credit tracker
  design-requirements.md  # Brief from brainstorming
  references/             # Uploaded wireframes/screenshots
```

## Plugin structure

```
stitch-design/
  .claude-plugin/
    plugin.json             # Plugin metadata (v0.2.0)
    marketplace.json        # Marketplace manifest
  .mcp.json                 # Stitch MCP — stdio proxy config
  skills/
    stitch-design/SKILL.md  # Main skill: brainstorm -> generate -> iterate
    stitch-edit/SKILL.md    # Screen editing
    stitch-upload/SKILL.md  # Image upload & digitization
    stitch-theme/SKILL.md   # Theme extraction
  commands/
    stitch-setup.md         # /stitch-setup command
    stitch-reset.md         # /stitch-reset command
  scripts/
    stitch-proxy.mjs        # MCP stdio proxy
    download.mjs            # Artifact downloader (zero-dep)
    extract-theme.mjs       # Tailwind/Fonts/Icons parser (zero-dep)
    setup-key.mjs           # API key setup helper
  package.json
  node_modules/             # Committed — zero-setup installation
```

## Requirements

- **Claude Code** (CLI, desktop, or IDE extension)
- **Node.js 20+**
- **Google Stitch API key** — free tier: 400 daily credits ([get one here](https://stitch.withgoogle.com/settings))

## Known limitations

- Google Stitch is in **Beta** — the API may change
- Long-running generation calls (`generate_screen_from_text`, `edit_screens`, `generate_variants`) may timeout with `ECONNRESET` after ~60s. This is a transport-layer limitation of the stdio proxy, not a Stitch API error. The plugin handles this automatically with a fire-and-poll strategy: it waits, then checks for the completed result server-side
- HTML output uses Tailwind CSS only (no other frameworks)
- Daily credit limit: 400 (Google AI Pro) / 350 (free tier)

## Credits

- [Google Stitch](https://stitch.withgoogle.com) — AI UI generation engine
- [`@google/stitch-sdk`](https://www.npmjs.com/package/@google/stitch-sdk) (v0.0.3) — official SDK, Apache 2.0

## License

Apache 2.0
