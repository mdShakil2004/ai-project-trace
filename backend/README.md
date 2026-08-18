# Trace Backend

Node.js + Express API for Trace. It persists investigations in Neon PostgreSQL, ingests GitHub pull requests with per-user authorization, performs deterministic source inspection plus evidence-first OpenRouter reasoning, stores semantic chunks in pgvector, and exposes the DTOs consumed by the existing React frontend.

## Stack

- Node.js
- Express
- TypeScript
- Neon PostgreSQL via `pg`
- PostgreSQL `vector` / pgvector
- GitHub OAuth + per-user encrypted GitHub credentials
- OpenRouter chat + embeddings
- WebSocket realtime analysis events
- Zod runtime validation

## Local setup

```bash
cd backend
npm install
cp .env.example .env
# fill DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
# GITHUB_TOKEN_ENCRYPTION_KEY, OPENROUTER_API_KEY and REALTIME_SECRET
npm run dev
```

The API listens on `http://localhost:8787` by default.

Frontend configuration contains only the public API origin:

```env
VITE_TRACE_API_BASE=http://localhost:8787/api/v1
```

Never put `DATABASE_URL`, `OPENROUTER_API_KEY`, GitHub client secrets, GitHub access tokens, `GITHUB_TOKEN_ENCRYPTION_KEY`, or `REALTIME_SECRET` in Vite environment variables.

### GitHub encryption key

`GITHUB_TOKEN_ENCRYPTION_KEY` is required for the GitHub OAuth connection flow. It must be a **base64-encoded 32-byte key**. The literal placeholder `base64-encoded-32-byte-key` is invalid and will cause OAuth to fail after GitHub redirects back to the callback.

Generate a valid local key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Put the generated value in `backend/.env` and restart the backend. Keep the same key across restarts; changing it makes previously stored GitHub credentials undecryptable.

## GitHub OAuth

Create a GitHub OAuth App and configure its callback as:

```text
http://localhost:8787/api/v1/auth/github/callback
```

For production, use the deployed backend URL instead.

The browser receives only an HttpOnly Trace session cookie. The GitHub access token is encrypted server-side and linked to the Trace user. It is never returned to the browser.

## API

Public:

- `GET /api/v1/health`
- `GET /api/v1/auth/github`
- `GET /api/v1/auth/github/callback`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`

Authenticated:

- `GET /api/v1/overview`
- `GET /api/v1/investigations`
- `POST /api/v1/investigations`
- `GET /api/v1/investigations/:id`
- `GET /api/v1/investigations/:id/events`
- `GET /api/v1/investigations/:id/changes`
- `GET /api/v1/investigations/:id/architecture`
- `GET /api/v1/investigations/:id/risks`
- `GET /api/v1/investigations/:id/verification`
- `GET /api/v1/investigations/:id/evidence`
- `GET /api/v1/investigations/:id/files`
- `POST /api/v1/investigations/:id/questions`
- `GET /api/v1/repositories`
- `POST /api/v1/repositories`
- `GET /api/v1/repositories/:id`
- settings and notification endpoints

## Security boundary

The application API is authenticated by default. Trace sessions are opaque random tokens; only SHA-256 hashes are stored in PostgreSQL. GitHub access tokens are encrypted with AES-256-GCM and linked to a single Trace user. The browser never receives database credentials, AI keys, GitHub client secrets, GitHub access tokens, encryption keys, or realtime signing secrets.

PostgreSQL RLS is enabled on user-owned repositories, investigations, events, settings, notifications and semantic chunks. Database ownership checks therefore remain effective even if a frontend request is manipulated.

Production requires an explicit `CORS_ORIGIN`. Realtime capability tokens are short-lived, HMAC signed, bound to both investigation and user, and checked against database ownership before events are sent.

Authentication, analysis and question endpoints use PostgreSQL-backed rate limits. Duplicate active analysis of the same user/repository/PR is prevented with a partial unique index and a conflict-safe lookup.

## Analysis lifecycle

`POST /investigations` validates the PR, creates a durable investigation row, then starts the analysis pipeline. The response is `202` with an investigation ID and short-lived realtime capability. Pipeline stages are persisted in `analysis_events` and delivered through WebSocket. The existing frontend can fall back to `GET /investigations/:id/events` polling.

The analysis pipeline is:

```text
GitHub PR
  -> changed files / commits / reviews / checks
  -> deterministic source structure extraction
  -> pgvector semantic indexing + retrieval
  -> context/token budgeting
  -> structured OpenRouter reasoning
  -> Zod schema validation
  -> evidence grounding
  -> persisted investigation
```

AI output is never trusted solely because a prompt says not to hallucinate. Evidence IDs and file references are validated against the fetched investigation context before persistence.

## Deployment

Run:

```bash
npm run build
npm start
```

or initialize the Neon database explicitly with:

```bash
npm run db:migrate
```

Set `NODE_ENV=production`, an exact `CORS_ORIGIN`, `FRONTEND_URL`, `APP_URL`, and strong random values for `REALTIME_SECRET` and `GITHUB_TOKEN_ENCRYPTION_KEY`.
