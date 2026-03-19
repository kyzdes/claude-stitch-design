#!/usr/bin/env node

/**
 * Local MCP proxy for Google Stitch.
 * Bridges Stitch's remote MCP server to a local stdio transport,
 * avoiding OAuth issues with Claude Code's HTTP MCP client.
 *
 * Reads STITCH_API_KEY from environment.
 */

import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("STITCH_API_KEY environment variable is required");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();
await proxy.start(transport);
