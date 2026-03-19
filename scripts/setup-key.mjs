#!/usr/bin/env node

/**
 * Saves STITCH_API_KEY to shell profile (~/.zshrc) so it's available
 * as an environment variable when Claude Code starts.
 *
 * Usage: node scripts/setup-key.mjs <api-key>
 *        node scripts/setup-key.mjs --remove
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const key = process.argv[2];

if (!key) {
  console.error("Usage: node setup-key.mjs <api-key> | --remove");
  process.exit(1);
}

// Detect shell profile
const zshrc = join(homedir(), ".zshrc");
const bashrc = join(homedir(), ".bashrc");
const profilePath = existsSync(zshrc) ? zshrc : bashrc;
const marker = "# stitch-design-plugin";

if (key === "--remove") {
  // Remove from shell profile
  if (existsSync(profilePath)) {
    const lines = readFileSync(profilePath, "utf-8").split("\n");
    const filtered = lines.filter(
      (line) => !line.includes("STITCH_API_KEY") || !line.includes(marker)
    );
    writeFileSync(profilePath, filtered.join("\n"));
  }
  console.log("REMOVED");
} else {
  // Remove old entry if exists, then add new one
  if (existsSync(profilePath)) {
    const lines = readFileSync(profilePath, "utf-8").split("\n");
    const filtered = lines.filter(
      (line) => !line.includes("STITCH_API_KEY") || !line.includes(marker)
    );
    writeFileSync(profilePath, filtered.join("\n"));
  }
  appendFileSync(profilePath, `\nexport STITCH_API_KEY="${key}" ${marker}\n`);
  console.log("SAVED");
}
