#!/usr/bin/env node

/**
 * Saves STITCH_API_KEY to ~/.claude/settings.json under env.
 * Creates the env section if it doesn't exist.
 *
 * Usage: node scripts/setup-key.mjs <api-key>
 *        node scripts/setup-key.mjs --remove
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const settingsPath = join(homedir(), ".claude", "settings.json");
const key = process.argv[2];

if (!key) {
  console.error("Usage: node setup-key.mjs <api-key> | --remove");
  process.exit(1);
}

let settings = {};
if (existsSync(settingsPath)) {
  settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
}

if (key === "--remove") {
  if (settings.env) {
    delete settings.env.STITCH_API_KEY;
    if (Object.keys(settings.env).length === 0) {
      delete settings.env;
    }
  }
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  console.log("REMOVED");
} else {
  if (!settings.env) settings.env = {};
  settings.env.STITCH_API_KEY = key;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  console.log("SAVED");
}
