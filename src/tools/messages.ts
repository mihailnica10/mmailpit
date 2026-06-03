import { z } from 'zod';
import type { McpServer, CallToolResult } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult } from '../client/client.js';
import { formatMessagesSummary, formatMessage, formatHeaders } from '../util/format.js';

export function registerMessageTools(server: McpServer, client: MailpitClient) {
  server.registerTool('list_messages', {
    description: 'List messages from Mailpit inbox with pagination, ordered from newest to oldest',
    inputSchema: z.object({
      start: z.number().optional().describe('Pagination offset (default: 0)'),
      limit: z.number().optional().describe('Number of messages to return (default: 50)'),
    }),
  }, async ({ start, limit }) => {
    try {
      const result = await client.listMessages(start, limit);
      return textResult(formatMessagesSummary(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('search_messages', {
    description: 'Search messages using Mailpit search syntax. Supports: from:, to:, subject:, message-id:, tag:, is:read/unread, has:attachment, before:, after:',
    inputSchema: z.object({
      query: z.string().describe('Search query using Mailpit search syntax (e.g. from:user@example.com subject:test is:unread has:attachment)'),
      start: z.number().optional().describe('Pagination offset (default: 0)'),
      limit: z.number().optional().describe('Number of messages to return (default: 50)'),
      timezone: z.string().optional().describe('Timezone for before:/after: filters (e.g. America/New_York)'),
    }),
  }, async ({ query, start, limit, timezone }) => {
    if (!query) return errorResult('query is required');
    try {
      const result = await client.searchMessages(query, start, limit, timezone);
      return textResult(formatMessagesSummary(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_message', {
    description: 'Get full details of a specific message including headers, body, and attachments. Marks the message as read.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.getMessage(id);
      return textResult(formatMessage(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_message_headers', {
    description: 'Get all headers of a specific message as key-value pairs',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.getMessageHeaders(id);
      return textResult(formatHeaders(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_message_source', {
    description: 'Get the raw RFC 2822 source of a message (full email including headers)',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.getMessageSource(id);
      return textResult(result);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('delete_messages', {
    description: 'Delete specific messages by ID, or all messages if no IDs provided. WARNING: Deletion is permanent.',
    inputSchema: z.object({
      ids: z.array(z.string()).optional().describe('Array of message IDs to delete. If empty, ALL messages will be deleted.'),
    }),
  }, async ({ ids }) => {
    try {
      await client.deleteMessages(ids ?? []);
      if (!ids || ids.length === 0) {
        return textResult('All messages deleted successfully');
      }
      return textResult(`Deleted ${ids.length} message(s) successfully`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('delete_search', {
    description: 'Delete all messages matching a search query. WARNING: Deletion is permanent.',
    inputSchema: z.object({
      query: z.string().describe('Search query to match messages for deletion'),
      timezone: z.string().optional().describe('Timezone for before:/after: filters'),
    }),
  }, async ({ query, timezone }) => {
    if (!query) return errorResult('query is required');
    try {
      await client.deleteSearch(query, timezone);
      return textResult(`Deleted messages matching query: ${query}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('set_read_status', {
    description: 'Mark messages as read or unread by IDs, search query, or all messages',
    inputSchema: z.object({
      ids: z.array(z.string()).optional().describe('Array of message IDs to update. If empty and no search provided, updates all messages.'),
      read: z.boolean().describe('Read status to set (true=read, false=unread)'),
      search: z.string().optional().describe('Optional search query to match messages instead of using IDs'),
    }),
  }, async ({ ids, read, search }) => {
    try {
      await client.setReadStatus(ids ?? [], read, search);
      const status = read ? 'read' : 'unread';
      return textResult(`Messages marked as ${status}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}