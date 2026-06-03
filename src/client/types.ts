export interface Address {
  Name?: string;
  Address: string;
}

export interface Attachment {
  PartID: string;
  FileName: string;
  ContentType: string;
  ContentID?: string;
  Size: number;
  Checksums?: Record<string, string>;
}

export interface ListUnsubscribe {
  Header?: string;
  HeaderPost?: string;
  Links?: string[];
  Errors?: string;
}

export interface Message {
  ID: string;
  MessageID: string;
  From?: Address;
  To: Address[];
  Cc?: Address[];
  Bcc?: Address[];
  ReplyTo?: Address[];
  Subject: string;
  Date: string;
  Tags?: string[];
  Text?: string;
  HTML?: string;
  Size: number;
  Attachments?: Attachment[];
  Inline?: Attachment[];
  ListUnsubscribe?: ListUnsubscribe;
  ReturnPath?: string;
  Username?: string;
}

export interface MessageSummary {
  ID: string;
  MessageID: string;
  From?: Address;
  To: Address[];
  Cc?: Address[];
  Bcc?: Address[];
  ReplyTo?: Address[];
  Subject: string;
  Created: string;
  Tags?: string[];
  Size: number;
  Attachments: number;
  Read: boolean;
  Snippet?: string;
  Username?: string;
}

export interface MessagesSummary {
  total: number;
  unread: number;
  messages_count: number;
  messages_unread: number;
  start: number;
  tags: string[];
  messages: MessageSummary[];
}

export interface RuntimeStats {
  Uptime: number;
  Memory: number;
  SMTPAccepted: number;
  SMTPAcceptedSize: number;
  SMTPRejected: number;
  SMTPIgnored: number;
  MessagesDeleted: number;
}

export interface AppInfo {
  Version: string;
  LatestVersion?: string;
  Database: string;
  DatabaseSize: number;
  Messages: number;
  Unread: number;
  Tags?: Record<string, number>;
  RuntimeStats?: RuntimeStats;
}

export interface MessageRelay {
  Enabled: boolean;
  SMTPServer?: string;
  AllowedRecipients?: string;
  BlockedRecipients?: string;
  OverrideFrom?: string;
  ReturnPath?: string;
  PreserveMessageIDs?: boolean;
}

export interface WebUIConfig {
  Label?: string;
  SpamAssassin: boolean;
  ChaosEnabled: boolean;
  DuplicatesIgnored: boolean;
  HideDeleteAllButton?: boolean;
  MessageRelay?: MessageRelay;
}

export interface HTMLCheckScore {
  Found: number;
  Supported: number;
  Partial: number;
  Unsupported: number;
}

export interface HTMLCheckResult {
  Family: string;
  Platform: string;
  Version?: string;
  Name: string;
  Support: string;
  NoteNumber?: string;
}

export interface HTMLCheckWarning {
  Slug: string;
  Title: string;
  Description?: string;
  URL?: string;
  Category: string;
  Tags?: string[];
  Keywords?: string;
  Score?: HTMLCheckScore;
  Results?: HTMLCheckResult[];
  NotesByNumber?: Record<string, string>;
}

export interface HTMLCheckTotal {
  Nodes: number;
  Tests: number;
  Supported: number;
  Partial: number;
  Unsupported: number;
}

export interface HTMLCheckResponse {
  Total?: HTMLCheckTotal;
  Warnings?: HTMLCheckWarning[];
  Platforms?: Record<string, string[]>;
}

export interface Link {
  URL: string;
  StatusCode: number;
  Status: string;
}

export interface LinkCheckResponse {
  Errors: number;
  Links?: Link[];
}

export interface SpamRule {
  Name: string;
  Score: number;
  Description?: string;
}

export interface SpamAssassinResponse {
  IsSpam: boolean;
  Score: number;
  Rules?: SpamRule[];
  Error?: string;
}

export interface ChaosTrigger {
  Probability: number;
  ErrorCode: number;
}

export interface ChaosTriggers {
  Sender?: ChaosTrigger;
  Recipient?: ChaosTrigger;
  Authentication?: ChaosTrigger;
}

export interface SendAddress {
  Email: string;
  Name?: string;
}

export interface SendAttachment {
  Filename: string;
  Content: string;
  ContentType?: string;
  ContentID?: string;
}

export interface SendMessageRequest {
  From?: SendAddress;
  To?: SendAddress[];
  Cc?: SendAddress[];
  Bcc?: string[];
  ReplyTo?: SendAddress[];
  Subject?: string;
  Text?: string;
  HTML?: string;
  Attachments?: SendAttachment[];
  Tags?: string[];
  Headers?: Record<string, string>;
}

export interface SendMessageResponse {
  ID: string;
}

export interface ReleaseRequest {
  To: string[];
}

export interface SetTagsRequest {
  IDs: string[];
  Tags: string[];
}

export interface RenameTagRequest {
  Name: string;
}

export interface SetReadStatusRequest {
  IDs?: string[];
  Read: boolean;
  Search?: string;
}

export interface DeleteMessagesRequest {
  IDs?: string[];
}

export type MessageHeaders = Record<string, string[]>;