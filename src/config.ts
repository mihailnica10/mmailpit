import { z } from 'zod';

const configSchema = z.object({
  MAILPIT_URL: z.string().default('http://localhost:8025'),
  MAILPIT_AUTH_USER: z.string().optional(),
  MAILPIT_AUTH_PASS: z.string().optional(),
  MAILPIT_TIMEOUT: z.coerce.number().default(30),
  MCP_TRANSPORT: z.enum(['stdio', 'http']).default('http'),
  MCP_HTTP_HOST: z.string().default('0.0.0.0'),
  MCP_HTTP_PORT: z.coerce.number().default(3000),
  MCP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MCP_HTTP_TOKEN: z.string().optional(),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;