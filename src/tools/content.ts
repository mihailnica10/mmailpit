import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult } from '../client/client.js';

export function registerContentTools(server: McpServer, client: MailpitClient) {
  server.registerTool('get_message_html', {
    description: 'Get the rendered HTML content of a message. Inline images are linked to the API. Returns 404 if message has no HTML part.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.getMessageHTML(id);
      return textResult(result);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_message_text', {
    description: 'Get the plain text content of a message',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.getMessageText(id);
      if (!result) return textResult('(Message has no text content)');
      return textResult(result);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_attachment', {
    description: 'Download an attachment from a message. Returns base64-encoded content for binary files.',
    inputSchema: z.object({
      message_id: z.string().describe("Message database ID or 'latest' for the most recent message"),
      part_id: z.string().describe('Attachment part ID (from message details)'),
    }),
  }, async ({ message_id, part_id }) => {
    if (!message_id) return errorResult('message_id is required');
    if (!part_id) return errorResult('part_id is required');
    try {
      const data = await client.getAttachment(message_id, part_id);
      const buffer = Buffer.from(data);
      const isText = !buffer.some((b: number) => b === 0 || (b < 32 && b !== 9 && b !== 10 && b !== 13));
      if (isText) {
        return textResult(buffer.toString('utf-8'));
      }
      return textResult(`Base64-encoded attachment (${buffer.length} bytes):\n${buffer.toString('base64')}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}