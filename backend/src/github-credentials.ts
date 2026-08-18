import crypto from 'node:crypto';
import { query } from './db.js';
import { currentUserId } from './request-context.js';

function encryptionKey() {
  const raw = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY is required.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  return key;
}

export function encryptGithubToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptGithubToken(value: string) {
  const [ivPart, tagPart, cipherPart] = value.split('.');
  if (!ivPart || !tagPart || !cipherPart) throw new Error('Invalid encrypted GitHub credential.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(cipherPart, 'base64url')), decipher.final()]).toString('utf8');
}

export async function saveGithubConnection(input: { userId: string; githubUserId: string; username: string; accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }) {
  await query(`create table if not exists github_connections (id uuid primary key default gen_random_uuid(),user_id uuid not null references users(id) on delete cascade,github_user_id text not null,github_username text not null,access_token_encrypted text not null,refresh_token_encrypted text,expires_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id),unique(github_user_id))`);
  await query(`insert into github_connections(user_id,github_user_id,github_username,access_token_encrypted,refresh_token_encrypted,expires_at) values($1,$2,$3,$4,$5,$6) on conflict(user_id) do update set github_user_id=excluded.github_user_id,github_username=excluded.github_username,access_token_encrypted=excluded.access_token_encrypted,refresh_token_encrypted=excluded.refresh_token_encrypted,expires_at=excluded.expires_at,updated_at=now()`, [input.userId, input.githubUserId, input.username, encryptGithubToken(input.accessToken), input.refreshToken ? encryptGithubToken(input.refreshToken) : null, input.expiresAt ?? null]);
}

export async function getGithubAccessToken(userId = currentUserId()) {
  if (!userId) return null;
  const { rows } = await query<any>('select access_token_encrypted,expires_at from github_connections where user_id=$1 limit 1', [userId]);
  if (!rows[0]) return null;
  if (rows[0].expires_at && new Date(rows[0].expires_at).getTime() <= Date.now()) return null;
  return decryptGithubToken(rows[0].access_token_encrypted);
}

export async function getGithubConnection(userId = currentUserId()) {
  if (!userId) return null;
  const { rows } = await query<any>('select github_user_id,github_username,expires_at,created_at,updated_at from github_connections where user_id=$1 limit 1', [userId]);
  return rows[0] ?? null;
}
