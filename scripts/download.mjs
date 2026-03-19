#!/usr/bin/env node

/**
 * Zero-dependency file downloader for Stitch artifacts.
 * Downloads HTML/PNG from Stitch URLs to local files.
 *
 * Usage: node scripts/download.mjs <url> <output-path>
 *
 * Examples:
 *   node scripts/download.mjs "https://..." "./stitch-output/screen1/index.html"
 *   node scripts/download.mjs "https://..." "./stitch-output/screen1/preview.png"
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [url, outputPath] = process.argv.slice(2);

if (!url || !outputPath) {
  console.error("Usage: node download.mjs <url> <output-path>");
  process.exit(1);
}

try {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "stitch-design-skill/0.1.0",
    },
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    process.exit(1);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);

  console.log(`Downloaded: ${outputPath} (${buffer.length} bytes)`);
} catch (error) {
  console.error(`Download failed: ${error.message}`);
  process.exit(1);
}
