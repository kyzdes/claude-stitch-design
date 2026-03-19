---
description: Set up or change Google Stitch API key
---

# Stitch Setup

Set up the Google Stitch API key for the stitch-design plugin.

## Steps

1. Ask the user for their API key using AskUserQuestion:
   "Paste your Google Stitch API key (get one at https://stitch.withgoogle.com/settings):"

2. When the user provides the key, run all three commands:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-key.mjs "<THE_KEY>"
   export STITCH_API_KEY="<THE_KEY>"
   source ~/.zshrc
   ```

3. **IMPORTANT**: Never echo, log, or display the API key back to the user after receiving it.

4. Tell the user:
   "API key saved to ~/.zshrc. It will be available in all future sessions. MCP server will connect on next Claude Code start."
