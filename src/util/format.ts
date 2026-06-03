import type { MessagesSummary, Message } from '../client/types.js';
import { formatAddress, formatSize } from '../client/client.js';

export function formatMessagesSummary(result: MessagesSummary): string {
  const lines: string[] = [];
  lines.push(
    `Found ${result.messages_count} message(s) (${result.messages_unread} unread) out of ${result.total} total\n`,
  );

  for (let i = 0; i < result.messages.length; i++) {
    const msg = result.messages[i];
    const num = i + 1 + result.start;
    const from = msg.From ? formatAddress(msg.From.Name, msg.From.Address) : 'unknown';
    const status = msg.Read ? '●' : '○';
    lines.push(`${num}. [${status}] ${msg.Subject}`);
    lines.push(`   ID: ${msg.ID}`);
    lines.push(`   From: ${from}`);
    lines.push(
      `   Date: ${new Date(msg.Created).toISOString().replace('T', ' ').slice(0, 19)} | Size: ${formatSize(msg.Size)}`,
    );
    if (msg.Attachments > 0) lines.push(`   Attachments: ${msg.Attachments}`);
    if (msg.Tags?.length) lines.push(`   Tags: ${msg.Tags.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatMessage(msg: Message): string {
  const lines: string[] = [];

  lines.push(`Subject: ${msg.Subject}`);
  lines.push(`ID: ${msg.ID}`);
  lines.push(`Message-ID: ${msg.MessageID}`);
  lines.push(`Date: ${new Date(msg.Date).toISOString().replace('T', ' ').slice(0, 19)}`);
  lines.push(`Size: ${formatSize(msg.Size)}\n`);

  if (msg.From) lines.push(`From: ${formatAddress(msg.From.Name, msg.From.Address)}`);
  if (msg.To?.length) {
    lines.push(
      `To: ${msg.To.map((a) => formatAddress(a.Name, a.Address)).join(', ')}`,
    );
  }
  if (msg.Cc?.length) {
    lines.push(
      `Cc: ${msg.Cc.map((a) => formatAddress(a.Name, a.Address)).join(', ')}`,
    );
  }
  if (msg.ReplyTo?.length) {
    lines.push(
      `Reply-To: ${msg.ReplyTo.map((a) => formatAddress(a.Name, a.Address)).join(', ')}`,
    );
  }
  if (msg.ReturnPath) lines.push(`Return-Path: ${msg.ReturnPath}`);

  if (msg.Tags?.length) lines.push(`\nTags: ${msg.Tags.join(', ')}`);

  if (msg.Attachments?.length) {
    lines.push(`\nAttachments (${msg.Attachments.length}):`);
    for (const a of msg.Attachments) {
      lines.push(
        `  - ${a.FileName} (${a.ContentType}, ${formatSize(a.Size)}, PartID: ${a.PartID})`,
      );
    }
  }

  if (msg.Inline?.length) {
    lines.push(`\nInline attachments (${msg.Inline.length}):`);
    for (const a of msg.Inline) {
      lines.push(
        `  - ${a.FileName} (${a.ContentType}, ${formatSize(a.Size)}, PartID: ${a.PartID})`,
      );
    }
  }

  lines.push('\n--- Text Body ---');
  lines.push(msg.Text || '(empty)');
  lines.push('\n--- HTML Body ---');
  if (msg.HTML) {
    const html =
      msg.HTML.length > 5000
        ? msg.HTML.slice(0, 5000) + '\n... (truncated, use get_message_html for full content)'
        : msg.HTML;
    lines.push(html);
  } else {
    lines.push('(empty)');
  }

  return lines.join('\n');
}

export function formatHeaders(headers: Record<string, string[]>): string {
  const lines: string[] = [];
  for (const [key, values] of Object.entries(headers)) {
    for (const value of values) {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}