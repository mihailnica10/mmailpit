import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult, formatSize } from '../client/client.js';
import type { AppInfo, WebUIConfig } from '../client/types.js';

function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
  return `${seconds}s`;
}

function formatAppInfo(info: AppInfo): string {
  const lines: string[] = [];
  lines.push('=== Mailpit Server Information ===\n');
  lines.push('VERSION:');
  lines.push(`  Current:  ${info.Version}`);
  if (info.LatestVersion && info.LatestVersion !== info.Version) {
    lines.push(`  Latest:   ${info.LatestVersion} (update available)`);
  }
  lines.push('\nDATABASE:');
  lines.push(`  Path: ${info.Database}`);
  lines.push(`  Size: ${formatSize(info.DatabaseSize)}`);
  lines.push('\nMESSAGES:');
  lines.push(`  Total:  ${info.Messages}`);
  lines.push(`  Unread: ${info.Unread}`);
  if (info.Tags && Object.keys(info.Tags).length > 0) {
    lines.push('\nTAGS:');
    for (const [tag, count] of Object.entries(info.Tags)) {
      lines.push(`  ${tag}: ${count} messages`);
    }
  }
  if (info.RuntimeStats) {
    lines.push('\nRUNTIME STATISTICS:');
    lines.push(`  Uptime:           ${formatDuration(info.RuntimeStats.Uptime)}`);
    lines.push(`  Memory Usage:     ${formatSize(info.RuntimeStats.Memory)}`);
    lines.push(`  SMTP Accepted:    ${info.RuntimeStats.SMTPAccepted} (${formatSize(info.RuntimeStats.SMTPAcceptedSize)})`);
    lines.push(`  SMTP Rejected:    ${info.RuntimeStats.SMTPRejected}`);
    if (info.RuntimeStats.SMTPIgnored > 0) {
      lines.push(`  SMTP Ignored:     ${info.RuntimeStats.SMTPIgnored}`);
    }
    lines.push(`  Messages Deleted: ${info.RuntimeStats.MessagesDeleted}`);
  }
  return lines.join('\n');
}

function enabledStr(enabled: boolean): string {
  return enabled ? 'Enabled' : 'Disabled';
}

function formatWebUIConfig(config: WebUIConfig): string {
  const lines: string[] = [];
  lines.push('=== Mailpit Configuration ===\n');
  if (config.Label) lines.push(`Instance Label: ${config.Label}\n`);
  lines.push('FEATURES:');
  lines.push(`  SpamAssassin:      ${enabledStr(config.SpamAssassin)}`);
  lines.push(`  Chaos Testing:     ${enabledStr(config.ChaosEnabled)}`);
  lines.push(`  Ignore Duplicates: ${enabledStr(config.DuplicatesIgnored)}`);
  lines.push(`  Hide Delete All:   ${enabledStr(config.HideDeleteAllButton ?? false)}`);
  if (config.MessageRelay) {
    lines.push('\nMESSAGE RELAY:');
    lines.push(`  Enabled: ${enabledStr(config.MessageRelay.Enabled)}`);
    if (config.MessageRelay.Enabled) {
      lines.push(`  SMTP Server: ${config.MessageRelay.SMTPServer ?? ''}`);
      if (config.MessageRelay.AllowedRecipients) {
        lines.push(`  Allowed Recipients: ${config.MessageRelay.AllowedRecipients}`);
      }
      if (config.MessageRelay.BlockedRecipients) {
        lines.push(`  Blocked Recipients: ${config.MessageRelay.BlockedRecipients}`);
      }
      if (config.MessageRelay.OverrideFrom) {
        lines.push(`  Override From: ${config.MessageRelay.OverrideFrom}`);
      }
      if (config.MessageRelay.ReturnPath) {
        lines.push(`  Return-Path: ${config.MessageRelay.ReturnPath}`);
      }
      lines.push(`  Preserve Message-IDs: ${enabledStr(config.MessageRelay.PreserveMessageIDs ?? false)}`);
    }
  }
  return lines.join('\n');
}

export function registerSystemTools(server: McpServer, client: MailpitClient) {
  server.registerTool('get_info', {
    description: 'Get Mailpit server information including version, database stats, message counts, and runtime statistics',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const result = await client.getInfo();
      return textResult(formatAppInfo(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_webui_config', {
    description: 'Get Mailpit web UI configuration including enabled features (SpamAssassin, Chaos, relay settings)',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const result = await client.getWebUIConfig();
      return textResult(formatWebUIConfig(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}