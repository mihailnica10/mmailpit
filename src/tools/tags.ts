import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult } from '../client/client.js';

export function registerTagTools(server: McpServer, client: MailpitClient) {
  server.registerTool('list_tags', {
    description: 'Get all unique message tags currently in use',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const result = await client.listTags();
      if (result.length === 0) return textResult('No tags found.');
      return textResult(`Tags (${result.length}):\n  - ${result.join('\n  - ')}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('set_tags', {
    description: 'Set tags on messages. This overwrites existing tags. Pass empty tags array to remove all tags.',
    inputSchema: z.object({
      ids: z.array(z.string()).describe('Array of message database IDs to tag'),
      tags: z.array(z.string()).describe('Array of tag names to set. Pass empty array to remove all tags.'),
    }),
  }, async ({ ids, tags }) => {
    if (!ids?.length) return errorResult('ids is required');
    try {
      await client.setTags(ids, tags);
      if (tags.length === 0) {
        return textResult(`Removed all tags from ${ids.length} message(s)`);
      }
      return textResult(`Set tags [${tags.join(', ')}] on ${ids.length} message(s)`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('rename_tag', {
    description: 'Rename an existing tag. Updates all messages with this tag.',
    inputSchema: z.object({
      old_name: z.string().describe('Current tag name to rename'),
      new_name: z.string().describe('New name for the tag'),
    }),
  }, async ({ old_name, new_name }) => {
    if (!old_name) return errorResult('old_name is required');
    if (!new_name) return errorResult('new_name is required');
    try {
      await client.renameTag(old_name, new_name);
      return textResult(`Renamed tag '${old_name}' to '${new_name}'`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('delete_tag', {
    description: 'Delete a tag. Removes the tag from all messages but does not delete the messages themselves.',
    inputSchema: z.object({
      name: z.string().describe('Tag name to delete'),
    }),
  }, async ({ name }) => {
    if (!name) return errorResult('name is required');
    try {
      await client.deleteTag(name);
      return textResult(`Deleted tag '${name}'`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}