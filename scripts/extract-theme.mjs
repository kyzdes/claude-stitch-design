#!/usr/bin/env node

/**
 * Zero-dependency Stitch HTML theme extractor.
 * Parses Stitch-generated HTML to extract Tailwind config, Google Fonts, and Material Symbols.
 *
 * Usage: node scripts/extract-theme.mjs <html-file> [--output-dir <dir>]
 *
 * Output files:
 *   - tailwind.config.extract.js  — Tailwind CSS theme configuration
 *   - fonts.css                   — Google Fonts @import statements
 *   - icons-manifest.json         — Material Symbols icon names
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const htmlPath = args[0];
const outputDirIdx = args.indexOf("--output-dir");
const outputDir = outputDirIdx !== -1 ? args[outputDirIdx + 1] : dirname(htmlPath);

if (!htmlPath) {
  console.error("Usage: node extract-theme.mjs <html-file> [--output-dir <dir>]");
  process.exit(1);
}

const html = readFileSync(resolve(htmlPath), "utf-8");

// --- Extract Tailwind Config ---
function extractTailwindConfig(html) {
  // Look for tailwind config in <script> tags
  // Stitch embeds it as: tailwind.config = { ... } or in a <script id="tailwind-config">
  const patterns = [
    /tailwind\.config\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/,
    /<script[^>]*id=["']tailwind-config["'][^>]*>([\s\S]*?)<\/script>/,
    /tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*;?\s*\n/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: extract inline style colors from Tailwind classes
  const colors = new Set();
  const colorPattern = /(?:bg|text|border|ring|from|to|via)-\[#([0-9a-fA-F]{3,8})\]/g;
  let m;
  while ((m = colorPattern.exec(html)) !== null) {
    colors.add(`#${m[1]}`);
  }

  if (colors.size > 0) {
    return `{\n  theme: {\n    extend: {\n      colors: {\n        // Extracted from inline Tailwind classes\n${[...colors].map((c, i) => `        'custom-${i + 1}': '${c}'`).join(",\n")}\n      }\n    }\n  }\n}`;
  }

  return null;
}

// --- Extract Google Fonts ---
function extractGoogleFonts(html) {
  const fonts = [];
  const fontLinkPattern = /href=["'](https:\/\/fonts\.googleapis\.com\/css2?\?[^"']+)["']/g;
  let match;
  while ((match = fontLinkPattern.exec(html)) !== null) {
    fonts.push(match[1]);
  }

  // Also check for @import in <style> tags
  const importPattern = /@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com\/[^"')]+)["']?\)/g;
  while ((match = importPattern.exec(html)) !== null) {
    fonts.push(match[1]);
  }

  return [...new Set(fonts)];
}

// --- Extract Material Symbols ---
function extractMaterialSymbols(html) {
  const icons = new Set();

  // Pattern 1: <span class="material-symbols-...">icon_name</span>
  const spanPattern = /<span[^>]*class=["'][^"']*material-symbols[^"']*["'][^>]*>([^<]+)<\/span>/g;
  let match;
  while ((match = spanPattern.exec(html)) !== null) {
    icons.add(match[1].trim());
  }

  // Pattern 2: Material Symbols font link
  const fontPattern = /fonts\.googleapis\.com\/css2?\?[^"']*family=Material\+Symbols/;
  const hasMaterialFont = fontPattern.test(html);

  return { icons: [...icons].sort(), hasMaterialFont };
}

// --- Run extraction ---
const tailwindConfig = extractTailwindConfig(html);
const googleFonts = extractGoogleFonts(html);
const materialSymbols = extractMaterialSymbols(html);

mkdirSync(resolve(outputDir), { recursive: true });

// Write Tailwind config
if (tailwindConfig) {
  const configContent = `/** Extracted from Stitch-generated HTML */\nexport default ${tailwindConfig}\n`;
  writeFileSync(join(outputDir, "tailwind.config.extract.js"), configContent);
  console.log(`Tailwind config: ${join(outputDir, "tailwind.config.extract.js")}`);
} else {
  console.log("No Tailwind configuration found in HTML");
}

// Write fonts CSS
if (googleFonts.length > 0) {
  const fontsContent = googleFonts.map((url) => `@import url('${url}');`).join("\n") + "\n";
  writeFileSync(join(outputDir, "fonts.css"), fontsContent);
  console.log(`Fonts CSS: ${join(outputDir, "fonts.css")} (${googleFonts.length} font(s))`);
} else {
  console.log("No Google Fonts found in HTML");
}

// Write icons manifest
const iconsManifest = {
  hasMaterialSymbolsFont: materialSymbols.hasMaterialFont,
  icons: materialSymbols.icons,
};
writeFileSync(join(outputDir, "icons-manifest.json"), JSON.stringify(iconsManifest, null, 2) + "\n");
console.log(`Icons manifest: ${join(outputDir, "icons-manifest.json")} (${materialSymbols.icons.length} icon(s))`);

console.log("\nExtraction complete.");
