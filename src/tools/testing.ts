import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { MailpitClient } from '../client/client.js';
import { textResult, errorResult, formatAddress } from '../client/client.js';
import type { ChaosTriggers } from '../client/types.js';

function formatChaosResult(result: ChaosTriggers): string {
  const lines: string[] = [];
  lines.push('=== Chaos Testing Configuration ===\n');

  const formatTrigger = (name: string, t: ChaosTriggers[keyof ChaosTriggers]) => {
    if (!t || t.Probability === 0) {
      lines.push(`${name}: Disabled`);
    } else {
      lines.push(`${name}: ${t.Probability}% probability, error code ${t.ErrorCode}`);
    }
  };

  formatTrigger('Sender (MAIL FROM)', result.Sender);
  formatTrigger('Recipient (RCPT TO)', result.Recipient);
  formatTrigger('Authentication', result.Authentication);

  return lines.join('\n');
}

export function registerTestingTools(server: McpServer, client: MailpitClient) {
  server.registerTool('send_message', {
    description: 'Send a test email message via Mailpit HTTP API. Useful for testing email templates and workflows.',
    inputSchema: z.object({
      from_email: z.string().describe('Sender email address (required)'),
      from_name: z.string().optional().describe('Sender display name'),
      to: z.array(z.object({
        email: z.string().describe('Recipient email address'),
        name: z.string().optional().describe('Recipient display name'),
      })).optional().describe('To recipients'),
      cc: z.array(z.object({
        email: z.string().describe('Recipient email address'),
        name: z.string().optional().describe('Recipient display name'),
      })).optional().describe('CC recipients'),
      bcc: z.array(z.string()).optional().describe('BCC recipient email addresses'),
      subject: z.string().optional().describe('Email subject'),
      text: z.string().optional().describe('Plain text body'),
      html: z.string().optional().describe('HTML body'),
      tags: z.array(z.string()).optional().describe('Tags to apply to the message'),
      headers: z.record(z.string(), z.string()).optional().describe('Custom headers as key-value pairs'),
    }),
  }, async ({ from_email, from_name, to, cc, bcc, subject, text, html, tags, headers }) => {
    if (!from_email) return errorResult(new Error('from_email is required'));
    try {
      const result = await client.sendMessage({
        From: { Email: from_email, Name: from_name },
        To: to?.map((r) => ({ Email: r.email, Name: r.name })),
        Cc: cc?.map((r) => ({ Email: r.email, Name: r.name })),
        Bcc: bcc,
        Subject: subject,
        Text: text,
        HTML: html,
        Tags: tags,
        Headers: headers as Record<string, string> | undefined,
      });
      const lines: string[] = [];
      lines.push('Message sent successfully!\n');
      lines.push(`Message ID: ${result.ID}`);
      lines.push(`From: ${formatAddress(from_name, from_email)}`);
      if (to?.length) {
        lines.push(`To: ${to.map((r) => formatAddress(r.name, r.email)).join(', ')}`);
      }
      lines.push(`Subject: ${subject ?? ''}`);
      return textResult(lines.join('\n'));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('release_message', {
    description: 'Release (relay) a captured message via the configured external SMTP server. Requires SMTP relay to be configured in Mailpit.',
    inputSchema: z.object({
      id: z.string().describe("Message database ID or 'latest' for the most recent message"),
      to: z.array(z.string()).describe('Email addresses to relay the message to'),
    }),
  }, async ({ id, to }) => {
    if (!id) return errorResult('id is required');
    if (!to?.length) return errorResult('to is required (at least one recipient)');
    try {
      await client.releaseMessage(id, to);
      return textResult(`Message ${id} released to: ${to.join(', ')}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('get_chaos', {
    description: 'Get current Chaos testing triggers configuration. Chaos allows simulating SMTP failures. Requires --enable-chaos flag.',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const result = await client.getChaos();
      return textResult(formatChaosResult(result));
    } catch (e) {
      return errorResult(e as Error);
    }
  });

  server.registerTool('set_chaos', {
    description: 'Set Chaos testing triggers to simulate SMTP failures. Set probability to 0 to disable a trigger. Requires --enable-chaos flag.',
    inputSchema: z.object({
      sender_probability: z.number().optional().describe('Probability (0-100) of rejecting at MAIL FROM stage'),
      sender_error_code: z.number().optional().describe('SMTP error code (400-599) for sender rejection'),
      recipient_probability: z.number().optional().describe('Probability (0-100) of rejecting at RCPT TO stage'),
      recipient_error_code: z.number().optional().describe('SMTP error code (400-599) for recipient rejection'),
      auth_probability: z.number().optional().describe('Probability (0-100) of rejecting authentication'),
      auth_error_code: z.number().optional().describe('SMTP error code (400-599) for auth rejection'),
    }),
  }, async ({ sender_probability, sender_error_code, recipient_probability, recipient_error_code, auth_probability, auth_error_code }) => {
    const triggers: ChaosTriggers = {};
    if ((sender_probability ?? 0) > 0 || (sender_error_code ?? 0) > 0) {
      triggers.Sender = { Probability: sender_probability ?? 0, ErrorCode: sender_error_code ?? 0 };
    }
    if ((recipient_probability ?? 0) > 0 || (recipient_error_code ?? 0) > 0) {
      triggers.Recipient = { Probability: recipient_probability ?? 0, ErrorCode: recipient_error_code ?? 0 };
    }
    if ((auth_probability ?? 0) > 0 || (auth_error_code ?? 0) > 0) {
      triggers.Authentication = { Probability: auth_probability ?? 0, ErrorCode: auth_error_code ?? 0 };
    }
    try {
      const result = await client.setChaos(triggers);
      const chaosText = formatChaosResult(result);
      return textResult(`Chaos triggers updated!\n\n${chaosText}`);
    } catch (e) {
      return errorResult(e as Error);
    }
  });
}