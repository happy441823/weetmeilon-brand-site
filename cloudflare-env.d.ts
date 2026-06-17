/* Generated baseline for local type-checking. Run `npm run cf-typegen` after real bindings are created. */
interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: unknown;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

interface CloudflareEnv {
  ASSETS: Fetcher;
  CMS_DB: D1Database;
  CMS_MEDIA: R2Bucket;
  CF_ACCESS_AUDIENCE: string;
  CF_ACCESS_ISSUER: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_JWKS_URL?: string;
  CMS_ALLOW_LOCAL_ADMIN?: string;
  CMS_LOCAL_ADMIN_EMAIL?: string;
  CMS_PUBLIC_D1_READS?: string;
}
