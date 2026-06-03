import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';

export function registerAllPrompts(server: McpServer) {
  server.registerPrompt('analyze_latest_email', {
    description: 'Analyze the most recent email for potential issues and provide a comprehensive review',
  }, async () => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Please fetch and analyze the latest email from Mailpit. Provide a comprehensive analysis including:

1. **Basic Information** - Subject, From, To, Date, Message ID and size, Any CC, BCC, or Reply-To addresses
2. **Content Analysis** - Does it have both HTML and plain text versions? Character count and content length? Are there any images (inline or linked)? Any attachments? List them with sizes.
3. **Technical Assessment** - Check the message structure (MIME parts), Look for any encoding issues, Verify proper header formatting
4. **Potential Issues** - Missing recommended headers, Possible spam trigger content, Broken or missing elements

Use the get_message tool with id="latest" to fetch the email, then provide your analysis.`,
      },
    }],
  }));

  server.registerPrompt('debug_email_delivery', {
    description: 'Debug email delivery and rendering issues for a specific message',
    argsSchema: z.object({
      message_id: z.string().optional().describe("Message ID to debug (optional, defaults to 'latest')"),
    }),
  }, async ({ message_id }) => {
    const messageID = message_id || 'latest';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me debug email delivery issues for message ID: ${messageID}

Please perform the following analysis:
1. Fetch Message Details (use get_message, use get_message_headers for detailed header analysis)
2. Header Analysis (SPF, DKIM, DMARC, Return-Path, X-Spam-*, Message-ID, Received headers for routing path)
3. Content Checks (run check_html, check_links, check_spam for SpamAssassin analysis if enabled)
4. Common Issues (missing headers, Content-Type issues, character encoding, suspicious patterns)
5. Recommendations (actionable fixes prioritised by severity)

Start by fetching the message details.`,
        },
      }],
    };
  });

  server.registerPrompt('check_email_quality', {
    description: 'Perform a comprehensive quality check on an email including HTML compatibility, links, and spam score',
    argsSchema: z.object({
      message_id: z.string().optional().describe("Message ID to check (optional, defaults to 'latest')"),
    }),
  }, async ({ message_id }) => {
    const messageID = message_id || 'latest';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a comprehensive quality check on message ID: ${messageID}

Run ALL the following checks and compile a quality report:
1. HTML Compatibility Check (use check_html)
2. Link Validation (use check_links with follow=true)
3. Spam Analysis (use check_spam)
4. Content Review (use get_message)

**Quality Report Format:**
## Email Quality Score: [X/100]
### Passed Checks
### Warnings
### Critical Issues
### Recommendations

Please run all checks and provide the comprehensive report.`,
        },
      }],
    };
  });

  server.registerPrompt('search_emails', {
    description: 'Help construct and execute a search query to find specific emails',
    argsSchema: z.object({
      criteria: z.string().describe("What you're looking for (e.g., 'emails from john about invoices last week')"),
    }),
  }, async ({ criteria }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me find emails matching this criteria: "${criteria}"

Available Search Syntax:
- from:email@example.com - Sender address
- to:email@example.com - Recipient address
- subject:keyword - Subject contains text
- message-id:id - Specific Message-ID header
- tag:tagname - Has specific tag
- is:read / is:unread - Read status
- has:attachment - Has attachments
- before:YYYY-MM-DD / after:YYYY-MM-DD - Date filters

Search Tips:
- Multiple terms combined with AND logic
- Use quotes for exact phrases
- Partial email matches work (e.g., from:@example.com)

Your Task:
1. Analyse my criteria and construct an appropriate search query
2. Execute the search using search_messages
3. Present results in clear format
4. If no results, suggest alternative search terms`,
        },
      }],
    };
  });

  server.registerPrompt('compose_test_email', {
    description: 'Help compose and send a test email for a specific scenario',
    argsSchema: z.object({
      scenario: z.string().describe('Type of email: welcome, notification, newsletter, transactional, plain, or custom description'),
    }),
  }, async ({ scenario }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me create and send a test email for this scenario: "${scenario}"

Standard Scenarios: welcome, notification, newsletter, transactional, plain

Requirements:
1. Create appropriate HTML content with inline CSS
2. Include a plain text version
3. Use realistic placeholder content
4. Follow email best practices (heading hierarchy, alt text, mobile-responsive, clear CTA)

Your Task:
1. Design an appropriate email based on the scenario
2. Show me the HTML and text content you'll use
3. Use send_message to deliver it (from_email: test@example.com, to: [{email: "recipient@example.com"}])
4. After sending, retrieve and display the sent message`,
        },
      }],
    };
  });

  server.registerPrompt('analyze_email_headers', {
    description: 'Perform deep analysis of email headers for routing, authentication, and debugging',
    argsSchema: z.object({
      message_id: z.string().optional().describe("Message ID to analyze (optional, defaults to 'latest')"),
    }),
  }, async ({ message_id }) => {
    const messageID = message_id || 'latest';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a deep analysis of email headers for message ID: ${messageID}

Use get_message_headers to fetch all headers, then analyze:

1. Routing Analysis - Parse Received headers, trace path, calculate hop times
2. Authentication Headers - SPF, DKIM, DMARC, ARC
3. Sender Information - From vs Return-Path vs Sender, Reply-To
4. Client & Server Info - User-Agent/X-Mailer, custom X-* headers
5. Timestamps - Date vs Received times, timezone handling
6. Security Flags - TLS indicators, spam scores, warnings

Provide structured analysis with findings and recommendations.`,
        },
      }],
    };
  });

  server.registerPrompt('compare_emails', {
    description: 'Compare two emails to identify differences (useful for A/B testing or debugging)',
    argsSchema: z.object({
      id1: z.string().describe('First message ID'),
      id2: z.string().describe('Second message ID'),
    }),
  }, async ({ id1, id2 }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Compare these two emails and highlight all differences:
- Message 1: ${id1}
- Message 2: ${id2}

Fetch both messages using get_message and compare:
1. Metadata Differences - Subject, From/To/CC, Date, Size
2. Header Differences - Changed, added, or removed headers
3. Content Differences - Text and HTML body changes
4. Structure Differences - Attachments, MIME structure, inline images
5. Tag Differences

Use diff-style format: [=] unchanged, [+] added, [-] removed, [~] modified`,
        },
      }],
    };
  });

  server.registerPrompt('summarize_inbox', {
    description: 'Get a comprehensive summary of the current Mailpit inbox state',
    argsSchema: z.object({
      limit: z.string().optional().describe('Number of recent messages to include in detail (default: 10)'),
    }),
  }, async ({ limit }) => {
    const limitValue = limit || '10';
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Provide a comprehensive summary of the Mailpit inbox.

Gather data using: get_info, list_messages with limit=${limitValue}, list_tags

Sections:
1. Overview - Total messages, unread count, database size, uptime
2. Recent Activity - Most recent ${limitValue} messages with subject, from, date, read status, tags
3. Top Senders - Identify most frequent senders
4. Subject Patterns - Common words or patterns
5. Tag Distribution - Tags with counts, untagged percentage
6. Insights - Notable patterns, potential issues, suggestions for organisation`,
        },
      }],
    };
  });
}