import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { formatAddress } from '../client/client.js';

export function registerAllResources(server: McpServer, client: MailpitClient) {
  server.registerResource('mailpit-info', 'mailpit://info', {
    title: 'Mailpit Server Info',
    description: 'Current Mailpit server information and statistics',
    mimeType: 'application/json',
  }, async (uri: URL) => {
    const info = await client.getInfo();
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(info, null, 2),
      }],
    };
  });

  server.registerResource('mailpit-latest', 'mailpit://messages/latest', {
    title: 'Latest Message',
    description: 'Summary of the most recent email message',
    mimeType: 'text/plain',
  }, async (uri: URL) => {
    const msg = await client.getMessage('latest');
    const lines: string[] = [];
    lines.push(`Subject: ${msg.Subject}`);
    lines.push(`ID: ${msg.ID}`);
    lines.push(`Date: ${new Date(msg.Date).toISOString().replace('T', ' ').slice(0, 19)}`);
    if (msg.From) lines.push(`From: ${formatAddress(msg.From.Name, msg.From.Address)}`);
    if (msg.To?.length) lines.push(`To: ${msg.To.map((a) => formatAddress(a.Name, a.Address)).join(', ')}`);
    if (msg.Tags?.length) lines.push(`Tags: ${msg.Tags.join(', ')}`);
    lines.push(`\nAttachments: ${msg.Attachments?.length ?? 0}`);
    if (msg.Text) {
      const preview = msg.Text.length > 500 ? msg.Text.slice(0, 500) + '...' : msg.Text;
      lines.push(`\nPreview:\n${preview}`);
    }
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/plain',
        text: lines.join('\n'),
      }],
    };
  });

  server.registerResource('mailpit-tags', 'mailpit://tags', {
    title: 'Message Tags',
    description: 'All current message tags',
    mimeType: 'application/json',
  }, async (uri: URL) => {
    const tags = await client.listTags();
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(tags, null, 2),
      }],
    };
  });

  server.registerResource('mailpit-config', 'mailpit://config', {
    title: 'Mailpit Configuration',
    description: 'Current Mailpit configuration and enabled features',
    mimeType: 'application/json',
  }, async (uri: URL) => {
    const cfg = await client.getWebUIConfig();
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(cfg, null, 2),
      }],
    };
  });
}