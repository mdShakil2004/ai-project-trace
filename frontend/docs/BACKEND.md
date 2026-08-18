# Trace backend

Trace now uses Supabase Edge Functions as its API boundary. The existing React UI remains in place; `src/services/api.ts` now calls the Supabase API and obtains an anonymous Supabase session for the demo flow.

## Setup

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins for the assignment/demo, or replace `ensureSession()` with your production SSO flow.
3. Run the SQL files under `supabase/migrations` in order.
4. Deploy the functions under `supabase/functions`.
5. Set server secrets from `.env.example`. Never put service-role, GitHub client secret/private key, encryption key, or OpenAI key into Vite variables.
6. Set `DEMO_MODE=true` for the deterministic evaluator path.
7. Set `DEMO_MODE=false` and configure GitHub OAuth + `GITHUB_TOKEN_ENCRYPTION_KEY` for real repositories.
8. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TRACE_API_BASE` in the frontend deployment.

## API

- `POST /functions/v1/api/investigations`
- `GET /functions/v1/api/investigations`
- `GET /functions/v1/api/investigations/:id`
- `GET /functions/v1/api/investigations/:id/changes`
- `GET /functions/v1/api/investigations/:id/architecture`
- `GET /functions/v1/api/investigations/:id/risks`
- `GET /functions/v1/api/investigations/:id/verification`
- `GET /functions/v1/api/investigations/:id/evidence`
- `GET /functions/v1/api/investigations/:id/files`
- `GET /functions/v1/api/investigations/:id/events`
- `POST /functions/v1/api/investigations/:id/questions`
- `GET /functions/v1/api/repositories`
- `GET /functions/v1/api/repositories/:id`
- `GET /functions/v1/api/overview`
- `GET /functions/v1/api/dashboard`

GitHub OAuth is exposed by `github-auth?action=connect` and `github-auth?action=callback`. Tokens are AES-GCM encrypted before persistence.

## Demo

With `DEMO_MODE=true`, analyzing `https://github.com/acme/payments-api/pull/482` creates the deterministic Trace investigation described by the product brief: 8 changed files, 3 affected services, 2 new dependencies, 3 risks, 4 verification checks, 82% reasoning confidence and MEDIUM overall risk.

The demo dataset is not randomly generated and does not claim to be real GitHub data.

## Security

The API requires a Supabase user JWT even though the Edge Functions have `verify_jwt=false`; this is intentional because the functions return structured application errors and perform the auth check themselves. Database RLS remains enabled for user-owned records. Service-role access is restricted to Edge Functions.

Repository/PR URLs are parsed strictly for `https://github.com/{owner}/{repo}/pull/{number}`. Repository content is treated as untrusted data in AI prompts. OpenAI is only called from the server and structured output is parsed before use.
