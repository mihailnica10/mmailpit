#!/usr/bin/env bun
import { McpServer, StdioServerTransport, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { config } from './config.js';
import { MailpitClient } from './client/client.js';
import { registerMessageTools } from './tools/messages.js';
import { registerContentTools } from './tools/content.js';
import { registerValidationTools } from './tools/validation.js';
import { registerTagTools } from './tools/tags.js';
import { registerTestingTools } from './tools/testing.js';
import { registerSystemTools } from './tools/system.js';
import { registerAllPrompts } from './prompts/prompts.js';
import { registerAllResources } from './resources/resources.js';

const server = new McpServer({
  name: 'mmailpit',
  version: '1.0.0',
});

const mailpitClient = new MailpitClient({
  baseUrl: config.MAILPIT_URL,
  username: config.MAILPIT_AUTH_USER,
  password: config.MAILPIT_AUTH_PASS,
  timeout: config.MAILPIT_TIMEOUT,
});

registerMessageTools(server, mailpitClient);
registerContentTools(server, mailpitClient);
registerValidationTools(server, mailpitClient);
registerTagTools(server, mailpitClient);
registerTestingTools(server, mailpitClient);
registerSystemTools(server, mailpitClient);
registerAllPrompts(server);
registerAllResources(server, mailpitClient);

async function main() {
  if (config.MCP_TRANSPORT === 'stdio') {
    console.error('Starting mmailpit in STDIO mode');
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    console.error(`Starting mmailpit in HTTP mode on ${config.MCP_HTTP_HOST}:${config.MCP_HTTP_PORT}`);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    Bun.serve({
      port: config.MCP_HTTP_PORT,
      hostname: config.MCP_HTTP_HOST,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === '/health' && req.method === 'GET') {
          return new Response('ok', { status: 200 });
        }
        if (url.pathname === '/mcp') {
          const accept = req.headers.get('accept') || '';
          if (!accept.includes('text/event-stream')) {
            req = new Request(req, {
              headers: { ...Object.fromEntries(req.headers), Accept: 'application/json, text/event-stream' },
            });
          }
        }
        return transport.handleRequest(req);
      },
    });
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});