#!/usr/bin/env node
import { startServer } from './api/server.js';
import MarkdownToCardServer from './mcp-server.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--mcp') || args.includes('-m')) {
    // Run as MCP server
    const mcpServer = new MarkdownToCardServer();
    await mcpServer.run();
  } else if (args.includes('--api') || args.includes('-a')) {
    // Run as API server
    startServer();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Markdown to Card Tool

Usage:
  node index.js [options]

Options:
  --mcp, -m     Run as MCP server (stdio)
  --api, -a     Run as API server (HTTP)
  --help, -h    Show this help message

Examples:
  node index.js --mcp     # Run as MCP server
  node index.js --api     # Run as API server on port 3000
  
MCP Server Features:
  - list_styles: List all available card styles
  - get_style: Get details of a specific style
  - preview_card: Preview card without saving
  - generate_card: Generate and save card image
  - list_generated_images: List all generated images
  - delete_image: Delete a generated image

API Server Endpoints:
  GET  /api/styles - Get all styles
  GET  /api/styles/:id - Get specific style
  POST /api/preview - Preview card
  POST /api/generate - Generate card
  GET  /api/images - List images
  GET  /api/images/:filename - Get image
  DELETE /api/images/:filename - Delete image
    `);
  } else {
    console.log('Please specify either --mcp or --api mode. Use --help for more information.');
    process.exit(1);
  }
}

main().catch(console.error);