---
description: Reset Stitch plugin - remove API key and clean working files
---

# Stitch Reset

Reset the stitch-design plugin configuration.

## Steps

1. Ask the user what to reset using AskUserQuestion:
   - "Remove API key only" — removes STITCH_API_KEY from settings
   - "Clean project files only" — removes ./stitch-design/ and ./stitch-output/ from current project
   - "Full reset" — both of the above

2. Based on the choice:

   **Remove API key:**
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-key.mjs --remove
   ```
   Tell user: "API key removed. Restart Claude Code to disconnect the Stitch MCP server."

   **Clean project files:**
   ```bash
   rm -rf ./stitch-design ./stitch-output
   ```
   Tell user: "Project design files cleaned."

   **Full reset:**
   Run both commands above.
   Tell user: "Plugin fully reset. Restart Claude Code to apply."
