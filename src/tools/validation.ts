import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult } from '../client/client.js';
import type { HTMLCheckResponse, LinkCheckResponse, SpamAssassinResponse } from '../client/types.js';

function formatHTMLCheckResult(result: HTMLCheckResponse): string {
  const lines: string[] = [];

  lines.push('=== HTML Email Compatibility Check ===\n');

  if (result.Total) {
    lines.push('OVERALL COMPATIBILITY:');
    lines.push(`  Supported:   ${result.Total.Supported.toFixed(1)}%`);
    lines.push(`  Partial:     ${result.Total.Partial.toFixed(1)}%`);
    lines.push(`  Unsupported: ${result.Total.Unsupported.toFixed(1)}%`);
    lines.push(`  HTML Nodes:  ${result.Total.Nodes}`);
    lines.push(`  Tests Run:   ${result.Total.Tests}\n`);
  }

  if (result.Warnings?.length) {
    lines.push(`COMPATIBILITY WARNINGS (${result.Warnings.length}):\n`);
    for (let i = 0; i < result.Warnings.length; i++) {
      const w = result.Warnings[i];
      lines.push(`${i + 1}. ${w.Title}`);
      lines.push(`   Category: ${w.Category}`);
      if (w.Description) lines.push(`   Description: ${w.Description}`);
      if (w.Score) {
        lines.push(`   Support: ${w.Score.Supported.toFixed(0)}% supported, ${w.Score.Partial.toFixed(0)}% partial, ${w.Score.Unsupported.toFixed(0)}% unsupported`);
      }
      if (w.URL) lines.push(`   More info: ${w.URL}`);
      if (w.Results?.length) {
        const unsupported = w.Results.filter((r) => r.Support === 'no').map((r) => r.Name);
        const partial = w.Results.filter((r) => r.Support === 'partial').map((r) => r.Name);
        if (unsupported.length > 0 && unsupported.length <= 10) {
          lines.push(`   Not supported in: ${unsupported.join(', ')}`);
        } else if (unsupported.length > 10) {
          lines.push(`   Not supported in: ${unsupported.length} email clients`);
        }
        if (partial.length > 0 && partial.length <= 10) {
          lines.push(`   Partial support in: ${partial.join(', ')}`);
        }
      }
      lines.push('');
    }
  } else {
    lines.push('No compatibility warnings found. Your email should render correctly across all tested email clients.\n');
  }

  if (result.Platforms && Object.keys(result.Platforms).length > 0) {
    lines.push('\nTESTED PLATFORMS:');
    for (const [platform, clients] of Object.entries(result.Platforms)) {
      lines.push(`  ${platform}: ${clients.join(', ')}`);
    }
  }

  return lines.join('\n');
}

function formatLinkCheckResult(result: LinkCheckResponse): string {
  const lines: string[] = [];

  lines.push('=== Link Validation Results ===\n');

  const total = result.Links?.length ?? 0;
  const errors = result.Errors;
  lines.push(`Total links checked: ${total}`);
  lines.push(`Errors found: ${errors}\n`);

  if (result.Links?.length) {
    const working = result.Links.filter((l) => l.StatusCode >= 200 && l.StatusCode < 400);
    const broken = result.Links.filter((l) => l.StatusCode < 200 || l.StatusCode >= 400);

    if (broken.length > 0) {
      lines.push('BROKEN LINKS:');
      for (const link of broken) {
        lines.push(`  [${link.StatusCode} ${link.Status}] ${link.URL}`);
      }
      lines.push('');
    }

    if (working.length > 0) {
      lines.push('WORKING LINKS:');
      for (const link of working) {
        lines.push(`  [${link.StatusCode}] ${link.URL}`);
      }
    }
  } else {
    lines.push('No links found in the message.');
  }

  return lines.join('\n');
}

function formatSpamCheckResult(result: SpamAssassinResponse): string {
  const lines: string[] = [];

  lines.push('=== SpamAssassin Analysis ===\n');

  if (result.Error) {
    lines.push(`Error: ${result.Error}`);
    return lines.join('\n');
  }

  lines.push(result.IsSpam ? 'SPAM DETECTED\n' : 'NOT SPAM\n');
  lines.push(`Spam Score: ${result.Score.toFixed(1)}\n`);

  if (result.Rules?.length) {
    lines.push('TRIGGERED RULES:');
    for (const rule of result.Rules) {
      const scoreStr = rule.Score > 0 ? `+${rule.Score.toFixed(1)}` : rule.Score.toFixed(1);
      lines.push(`  [${scoreStr}] ${rule.Name}`);
      if (rule.Description) lines.push(`         ${rule.Description}`);
    }
  } else {
    lines.push('No spam rules triggered.');
  }

  return lines.join('\n');
}

export function registerValidationTools(server: McpServer, client: MailpitClient) {
  server.registerTool('check_html', {
    description: 'Check email HTML/CSS compatibility across different email clients (Outlook, Gmail, Apple Mail, etc.). Uses caniemail.com database.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.checkHTML(id);
      return textResult(formatHTMLCheckResult(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('check_links', {
    description: 'Validate all links and images in a message. Checks HTTP status codes for each URL.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
      follow: z.boolean().optional().describe('Follow redirects when checking links (default: false)'),
    }),
  }, async ({ id, follow }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.checkLinks(id, follow);
      return textResult(formatLinkCheckResult(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('check_spam', {
    description: 'Run SpamAssassin analysis on a message. Returns spam score and triggered rules. Requires SpamAssassin to be enabled in Mailpit.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
    }),
  }, async ({ id }) => {
    if (!id) return errorResult('id is required');
    try {
      const result = await client.checkSpam(id);
      return textResult(formatSpamCheckResult(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}