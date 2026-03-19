---
description: Set up or change Google Stitch API key
---

# Stitch Setup

Set up the Google Stitch API key for the stitch-design plugin.

## Steps

1. Ask the user for their API key using AskUserQuestion:
   "Paste your Google Stitch API key (get one at https://stitch.withgoogle.com/settings):"

2. When the user provides the key, save it immediately:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-key.mjs "<THE_KEY>"
   ```

3. **IMPORTANT**: Never echo, log, or display the API key back to the user after receiving it.

4. Tell the user:
   "API key saved. Restart Claude Code (`/exit` then reopen) to connect the Stitch MCP server."

That's it. No other steps needed — the plugin's .mcp.json handles MCP configuration automatically once the key is in the environment.
