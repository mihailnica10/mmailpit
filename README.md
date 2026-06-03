<p align="center">
  <img src="https://img.shields.io/badge/mmailpit-FB7185?style=for-the-badge&logo=minutemailer&logoColor=white" alt="mmailpit" width="200">
</p>

<p align="center">
  <strong>MCP server for Mailpit</strong><br>
  <em>24 tools · 8 prompts · 4 resources</em>
</p>

<p align="center">
  <a href="https://github.com/mihailnica10/mmailpit"><img src="https://img.shields.io/github/actions/workflow/status/mihailnica10/mmailpit/ci.yml?branch=main&style=flat&label=build" alt="Build"></a>
  <a href="https://github.com/mihailnica10/mmailpit/pkgs/container/mmailpit"><img src="https://img.shields.io/badge/ghcr-mmailpit-2496ED?style=flat&logo=docker&logoColor=white" alt="GHCR"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/bun-1.x-black?style=flat&logo=bun" alt="Bun"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

[mmailpit](https://github.com/mihailnica10/mmailpit) is an [MCP](https://modelcontextprotocol.io) server that wraps the [Mailpit](https://github.com/axllent/mailpit) API, giving AI assistants full control over a local test email environment.

## Quick Start

```bash
docker run -d \
  --name mmailpit \
  -p 3002:3000 \
  -e MAILPIT_URL=http://host.docker.internal:8025 \
  ghcr.io/mihailnica10/mmailpit:latest
```

### Prerequisites

- [Mailpit](https://github.com/axllent/mailpit) — running and accessible
- [Bun](https://bun.sh) — to run from source (optional)

### From Source

```bash
git clone https://github.com/mihailnica10/mmailpit.git
cd mmailpit
bun install
MCP_TRANSPORT=http bun run src/index.ts
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAILPIT_URL` | `http://localhost:8025` | Mailpit API base URL |
| `MAILPIT_AUTH_USER` | — | Basic auth username |
| `MAILPIT_AUTH_PASS` | — | Basic auth password |
| `MAILPIT_TIMEOUT` | `10000` | API timeout (ms) |
| `MCP_TRANSPORT` | `http` | Transport mode (`http` or `stdio`) |
| `MCP_HTTP_HOST` | `0.0.0.0` | HTTP listen host |
| `MCP_HTTP_PORT` | `3000` | HTTP listen port |

## MCP Client Setup

```json
{
  "mmailpit": {
    "type": "http",
    "url": "http://localhost:3002/mcp"
  }
}
```

## Tools

### Messages

| Tool | Description |
|------|-------------|
| `list_messages` | Paginated inbox listing with search, filtering, and sorting |
| `get_message` | Full message details by ID |
| `search_messages` | Full-text search across all messages |
| `delete_messages` | Delete one or more messages |
| `get_message_attachments` | List attachments for a message |
| `download_attachment` | Download a specific attachment |
| `forward_message` | Forward a message to a new recipient |
| `get_message_counts` | Inbox statistics (total, unread, etc.) |

### Content

| Tool | Description |
|------|-------------|
| `get_message_html` | Rendered HTML preview |
| `get_message_text` | Plain text body |
| `get_message_raw` | Raw email source (RFC 822) |

### Validation

| Tool | Description |
|------|-------------|
| `validate_html` | Check HTML for rendering issues and broken tags |
| `check_links` | Verify all links resolve correctly |
| `spam_score` | Spam score analysis via SpamAssassin |

### Tags

| Tool | Description |
|------|-------------|
| `list_tags` | All tags with message counts |
| `create_tag` | Create a new tag |
| `rename_tag` | Rename an existing tag |
| `tag_messages` | Assign tags to messages |
| `untag_messages` | Remove tags from messages |

### Testing

| Tool | Description |
|------|-------------|
| `send_test_email` | Send a test email through Mailpit's SMTP |
| `release_messages` | Release held messages to recipients |
| `release_latest` | Release the most recent held message |
| `chaos_monkey` | Release/delete a random subset of messages |

### System

| Tool | Description |
|------|-------------|
| `get_server_info` | Mailpit version and capabilities |
| `get_stats` | Detailed delivery statistics |

## Prompts

- `analyze_latest_email` — review the most recent email
- `debug_email_delivery` — diagnose delivery issues
- `check_email_quality` — full quality check (HTML, links, spam)
- `search_emails` — search across the inbox
- `compose_test_email` — compose and send a test email
- `analyze_email_headers` — parse and explain email headers
- `compare_emails` — compare two messages side by side
- `summarize_inbox` — summary of recent email activity

## Resources

| URI | Description |
|-----|-------------|
| `mailpit://info` | Server information |
| `mailpit://messages/latest` | Latest message (updates on change) |
| `mailpit://tags` | All tags (updates on change) |
| `mailpit://webui` | Web UI configuration |

## Docker

Pre-built images are available on [GitHub Container Registry](https://github.com/mihailnica10/mmailpit/pkgs/container/mmailpit):

```bash
docker pull ghcr.io/mihailnica10/mmailpit:latest
```

The image exposes port `3000`. Reference the container as `http://mmailpit:3000/mcp` from other Docker services, or map to a host port for local access.

## Acknowledgments

mmailpit is a TypeScript port of [amirhmoradi/mailpit-mcp](https://github.com/amirhmoradi/mailpit-mcp), originally written in Go by [Amir H. Moradi](https://github.com/amirhmoradi). All credit for the original tool design and API mapping goes to the author.

## License

MIT
