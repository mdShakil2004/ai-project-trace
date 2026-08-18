import { query } from './db.js';
import { currentUserId } from './request-context.js';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

let initialization: Promise<void> | null = null;

export async function initRateLimitDb() {
  await query(`
    create table if not exists rate_limit_buckets (
      bucket_key text primary key,
      window_started_at timestamptz not null,
      request_count integer not null default 0,
      expires_at timestamptz not null
    );
    create index if not exists rate_limit_buckets_expiry_idx on rate_limit_buckets(expires_at);
  `);
}

async function ensureRateLimitDb() {
  if (!initialization) {
    initialization = initRateLimitDb().catch(error => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

function clientIdentity(req: { ip?: string }) {
  return req.ip || 'unknown';
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = now.getTime() + windowSeconds * 1000;
  const result = await query<{ request_count: number; window_started_at: string; expires_at: string }>(
    `
      insert into rate_limit_buckets(bucket_key, window_started_at, request_count, expires_at)
      values ($1, $2, 1, $3)
      on conflict (bucket_key) do update
      set request_count = case
        when rate_limit_buckets.expires_at <= $2
          then 1
        else rate_limit_buckets.request_count + 1
      end,
      window_started_at = case
        when rate_limit_buckets.expires_at <= $2
          then $2
        else rate_limit_buckets.window_started_at
      end,
      expires_at = case
        when rate_limit_buckets.expires_at <= $2
          then $3
        else rate_limit_buckets.expires_at
      end
      returning request_count, window_started_at, expires_at
    `,
    [key, now, new Date(resetAt)],
  );

  const count = Number(result.rows[0]?.request_count ?? limit + 1);
  const expiresAt = result.rows[0]?.expires_at ? new Date(result.rows[0].expires_at).getTime() : resetAt;
  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  return { allowed, limit, remaining, resetAt: expiresAt };
}

export function rateLimit(options: {
  name: string;
  limit: number;
  windowSeconds: number;
  scope?: 'user' | 'ip' | 'user_ip';
}) {
  return async (req: any, res: any, next: any) => {
    try {
      await ensureRateLimitDb();
      const userId = currentUserId();
      const scope = options.scope || 'user';
      const ip = clientIdentity(req);
      const identity = scope === 'ip'
        ? `ip:${ip}`
        : scope === 'user_ip'
          ? `user:${userId || 'anonymous'}:ip:${ip}`
          : `user:${userId || 'anonymous'}`;

      // Analysis is the expensive operation, but a 5/hour limit is too
      // restrictive during normal product testing. Keep it configurable and
      // default to 10/hour; other rate-limited endpoints keep their explicit limits.
      const effectiveLimit = options.name === 'analysis-user'
        ? Number(process.env.ANALYSIS_RATE_LIMIT || 10)
        : options.limit;
      const effectiveWindow = options.name === 'analysis-user'
        ? Number(process.env.ANALYSIS_RATE_WINDOW_SECONDS || options.windowSeconds)
        : options.windowSeconds;

      const result = await consumeRateLimit(`rl:${options.name}:${identity}`, effectiveLimit, effectiveWindow);
      res.setHeader('RateLimit-Limit', String(result.limit));
      res.setHeader('RateLimit-Remaining', String(result.remaining));
      res.setHeader('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
      if (!result.allowed) {
        res.setHeader(
          'Retry-After',
          String(
            Math.max(
              1,
              Math.ceil(
                (result.resetAt - Date.now()) / 1000,
              ),
            ),
          ),
        );
        return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } });
      }
      return next();
    } catch {
      return res.status(503).json({ error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'Request protection is temporarily unavailable.' } });
    }
  };
}

export function cleanupRateLimitBuckets() {
  return query('delete from rate_limit_buckets where expires_at < now()');
}
