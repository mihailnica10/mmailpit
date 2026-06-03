import { type CallToolResult } from '@modelcontextprotocol/server';
import type {
  Address,
  Attachment,
  Message,
  MessageHeaders,
  MessagesSummary,
  AppInfo,
  WebUIConfig,
  HTMLCheckResponse,
  LinkCheckResponse,
  SpamAssassinResponse,
  ChaosTriggers,
  SendMessageRequest,
  SendMessageResponse,
} from './types.js';

export class MailpitClient {
  private baseUrl: string;
  private auth?: { username: string; password: string };
  private timeout: number;

  constructor(opts: {
    baseUrl: string;
    username?: string;
    password?: string;
    timeout?: number;
  }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    if (opts.username || opts.password) {
      this.auth = { username: opts.username ?? '', password: opts.password ?? '' };
    }
    this.timeout = opts.timeout ?? 30;
  }

  private async request<T>(
    method: string,
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    let bodyData: string | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyData,
      signal: AbortSignal.timeout(this.timeout * 1000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mailpit API error (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  private async requestText(method: string, path: string): Promise<string> {
    let url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(this.timeout * 1000),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mailpit API error (${response.status}): ${text}`);
    }
    return response.text();
  }

  private async requestBinary(
    method: string,
    path: string,
  ): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(this.timeout * 1000),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mailpit API error (${response.status}): ${text}`);
    }
    return response.arrayBuffer();
  }

  // Messages

  async listMessages(start?: number, limit?: number): Promise<MessagesSummary> {
    return this.request<MessagesSummary>('GET', '/api/v1/messages', {
      start: start ?? 0,
      limit: limit ?? 50,
    });
  }

  async searchMessages(
    query: string,
    start?: number,
    limit?: number,
    tz?: string,
  ): Promise<MessagesSummary> {
    return this.request<MessagesSummary>('GET', '/api/v1/search', {
      query,
      start: start ?? 0,
      limit: limit ?? 50,
      tz,
    });
  }

  async getMessage(id: string): Promise<Message> {
    return this.request<Message>('GET', `/api/v1/message/${encodeURIComponent(id)}`);
  }

  async getMessageHeaders(id: string): Promise<MessageHeaders> {
    return this.request<MessageHeaders>(
      'GET',
      `/api/v1/message/${encodeURIComponent(id)}/headers`,
    );
  }

  async getMessageSource(id: string): Promise<string> {
    return this.requestText('GET', `/api/v1/message/${encodeURIComponent(id)}/raw`);
  }

  async deleteMessages(ids: string[]): Promise<void> {
    await this.request('DELETE', '/api/v1/messages', undefined, { ids });
  }

  async deleteSearch(query: string, tz?: string): Promise<void> {
    await this.request('DELETE', '/api/v1/search', { query, tz });
  }

  async setReadStatus(ids: string[], read: boolean, search?: string): Promise<void> {
    await this.request('PUT', '/api/v1/messages', undefined, {
      ids: ids.length > 0 ? ids : undefined,
      read,
      search: search || undefined,
    });
  }

  // Content

  async getMessageHTML(id: string): Promise<string> {
    return this.requestText('GET', `/view/${encodeURIComponent(id)}.html`);
  }

  async getMessageText(id: string): Promise<string> {
    return this.requestText('GET', `/view/${encodeURIComponent(id)}.txt`);
  }

  async getAttachment(
    messageID: string,
    partID: string,
  ): Promise<ArrayBuffer> {
    return this.requestBinary(
      'GET',
      `/api/v1/message/${encodeURIComponent(messageID)}/part/${encodeURIComponent(partID)}`,
    );
  }

  // Validation

  async checkHTML(id: string): Promise<HTMLCheckResponse> {
    return this.request<HTMLCheckResponse>(
      'GET',
      `/api/v1/message/${encodeURIComponent(id)}/html-check`,
    );
  }

  async checkLinks(
    id: string,
    follow?: boolean,
  ): Promise<LinkCheckResponse> {
    return this.request<LinkCheckResponse>(
      'GET',
      `/api/v1/message/${encodeURIComponent(id)}/link-check`,
      follow ? { follow: true } : undefined,
    );
  }

  async checkSpam(id: string): Promise<SpamAssassinResponse> {
    return this.request<SpamAssassinResponse>(
      'GET',
      `/api/v1/message/${encodeURIComponent(id)}/sa-check`,
    );
  }

  // Tags

  async listTags(): Promise<string[]> {
    return this.request<string[]>('GET', '/api/v1/tags');
  }

  async setTags(ids: string[], tags: string[]): Promise<void> {
    await this.request('PUT', '/api/v1/tags', undefined, { ids, tags });
  }

  async renameTag(oldName: string, newName: string): Promise<void> {
    await this.request('PUT', `/api/v1/tags/${encodeURIComponent(oldName)}`, undefined, {
      name: newName,
    });
  }

  async deleteTag(name: string): Promise<void> {
    await this.request('DELETE', `/api/v1/tags/${encodeURIComponent(name)}`);
  }

  // Testing

  async sendMessage(msg: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('POST', '/api/v1/send', undefined, msg);
  }

  async releaseMessage(id: string, to: string[]): Promise<void> {
    await this.request('POST', `/api/v1/message/${encodeURIComponent(id)}/release`, undefined, {
      to,
    });
  }

  async getChaos(): Promise<ChaosTriggers> {
    return this.request<ChaosTriggers>('GET', '/api/v1/chaos');
  }

  async setChaos(triggers: ChaosTriggers): Promise<ChaosTriggers> {
    return this.request<ChaosTriggers>('PUT', '/api/v1/chaos', undefined, triggers);
  }

  // System

  async getInfo(): Promise<AppInfo> {
    return this.request<AppInfo>('GET', '/api/v1/info');
  }

  async getWebUIConfig(): Promise<WebUIConfig> {
    return this.request<WebUIConfig>('GET', '/api/v1/webui');
  }
}

export function textResult(text: string): CallToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

export function errorResult(error: string | Error): CallToolResult {
  return {
    content: [{ type: 'text', text: error instanceof Error ? error.message : error }],
    isError: true,
  };
}

export function formatAddress(name?: string, address?: string): string {
  if (!address) return 'unknown';
  if (name) return `"${name}" <${address}>`;
  return address;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}