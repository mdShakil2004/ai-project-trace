

# Trace

### AI Change Intelligence for Software 

**Understand the change. Verify the reasoning. Ship with confidence.**

Trace is an AI-powered developer tool that analyzes GitHub pull requests and turns raw code changes into an evidence-backed engineering review.

Instead of forcing engineers to manually inspect a large PR, understand its architectural impact, search historical context, identify risks, and determine what still needs verification, Trace brings those steps into a single workflow.

---

## Overview

Modern software teams increasingly use AI coding assistants and automated development workflows to generate and modify large amounts of code.

The difficult part is no longer only:

> "Can we generate the code?"

It is increasingly:

> "Do we understand what changed, why it changed, what it could break, and how do we verify it?"

Trace is designed around that problem.

Given a GitHub Pull Request, Trace:

1. Fetches the pull request and repository context.
2. Reads the changed files and patches.
3. Collects commits, issues, comments, reviews, and available CI checks.
4. Recovers relevant historical context through semantic retrieval.
5. Uses an AI analysis pipeline to reason about the change.
6. Identifies architectural impact and affected components.
7. Surfaces concrete risks and supporting evidence.
8. Identifies verification gaps.
9. Streams analysis progress to the frontend in real time.
10. Stores the resulting investigation for later review.

The result is an engineering-oriented investigation rather than a generic AI summary.

---

# Product Goals

Trace is built around five core goals.

### 1. Understand the Change

Explain what changed at the code and system level.

### 2. Explain the Reasoning

Connect the implementation changes to the intent, surrounding code, PR discussion, and historical context.

### 3. Identify Engineering Risk

Surface concrete risks instead of producing generic warnings.

### 4. Ground Conclusions in Evidence

AI-generated conclusions should be tied to repository and investigation evidence wherever possible.

### 5. Improve Verification

Identify tests, checks, or verification steps that are missing, failed, or insufficient.

---

# Core Workflow

```text
                    GitHub Pull Request
                            │
                            ▼
                 ┌─────────────────────┐
                 │   GitHub Context     │
                 │                     │
                 │ PR metadata         │
                 │ Changed files       │
                 │ Commits             │
                 │ Issues              │
                 │ Comments            │
                 │ Reviews             │
                 │ CI checks            │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Context Processing   │
                 │                     │
                 │ Diff statistics     │
                 │ Code chunks         │
                 │ Historical context  │
                 │ Semantic retrieval  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   AI Analysis       │
                 │                     │
                 │ Change analysis     │
                 │ Architecture        │
                 │ Risk assessment     │
                 │ Evidence            │
                 │ Verification        │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Investigation       │
                 │                     │
                 │ Summary             │
                 │ Changes             │
                 │ Architecture        │
                 │ Risks               │
                 │ Evidence            │
                 │ Verification        │
                 └──────────┬──────────┘
                            │
                            ▼
                    Engineering Review
````

---

# Key Features

## Pull Request Analysis

Trace accepts GitHub Pull Request URLs and creates an investigation around the change.

The analysis collects:

* Pull request metadata
* Changed files
* File patches
* Commit history
* Associated issue information
* Issue comments
* Pull request reviews
* CI/check-run information
* Repository metadata

Public repositories can be analyzed without requiring the user to connect GitHub.

For connected users, Trace prefers their GitHub OAuth token, which enables access to private repositories and provides a higher API rate limit.

If a connected GitHub token cannot access a public repository, Trace can retry the public GitHub API anonymously rather than unnecessarily blocking the analysis.

---

# AI Change Intelligence

The analysis pipeline is designed around multiple dimensions of software change.

### Change Summary

Explains the actual modifications introduced by the PR.

### Why It Changed

Uses PR context, discussion, historical information, and retrieved repository context to understand the reasoning behind the change.

### Architecture

Analyzes the architectural implications of the change, including affected components and relationships.

### Risk Analysis

Identifies engineering risks and assigns severity levels:

* Low
* Medium
* High
* Critical

Risk information can include affected components and risk categories.

### Evidence

Analysis results can reference evidence collected during the investigation.

### Verification

Trace evaluates available verification information and highlights:

* Missing checks
* Failed checks
* Verification gaps
* Other areas requiring engineering review

---

# Analysis Pipeline

An investigation progresses through the following stages:

```text
1. Connecting to GitHub
        ↓
2. Fetching pull request
        ↓
3. Reading changed files
        ↓
4. Mapping dependencies
        ↓
5. Recovering historical context
        ↓
6. Assessing architectural impact
        ↓
7. Identifying risks
        ↓
8. Checking verification
```

Each stage is persisted as an analysis event and can be streamed to the frontend.

This allows the UI to show the analysis as it happens instead of waiting for a single long-running request to finish.

---

# Semantic Retrieval

Trace includes a semantic context layer to retrieve relevant repository information for an investigation.

Changed-code patches and selected commit information can be split into chunks and embedded through the configured embedding model.

During analysis, relevant chunks are retrieved using vector similarity.

The semantic retrieval flow is:

```text
Repository / PR Context
        │
        ▼
     Chunking
        │
        ▼
   Embeddings
        │
        ▼
 PostgreSQL + pgvector
        │
        ▼
 Similarity Retrieval
        │
        ▼
 AI Investigation
```

The implementation uses the configured OpenRouter embedding model and PostgreSQL vector search.

Semantic retrieval is treated as an enhancement to the analysis pipeline. If retrieval is temporarily unavailable, the core investigation can still continue.

---

# Realtime Analysis

Long-running investigations should not require the frontend to repeatedly poll the backend.

Trace uses WebSockets for realtime analysis events.

```text
Backend Analysis
       │
       ├── Stage started
       ├── Stage completed
       ├── Stage updated
       └── Investigation completed
                │
                ▼
          WebSocket
                │
                ▼
            Frontend
```

Realtime connections are authenticated using short-lived signed investigation tokens.

The realtime layer also verifies the investigation identity before exposing investigation events.

---

# Authentication

Trace supports two authentication methods.

## Email / Password

Users can:

* Create an account
* Sign in
* Maintain a server-side session
* Log out

Passwords are hashed using Node.js `scrypt`.

Sessions are represented by random tokens whose SHA-256 hashes are stored in PostgreSQL.

The session itself is stored in an:

```text
HttpOnly
```

cookie.

---

## GitHub OAuth

Users can connect GitHub using OAuth.

The OAuth flow supports:

* GitHub identity
* GitHub repository access
* Private repository access
* Pull request analysis
* Repository browsing

GitHub access tokens are encrypted before being stored.

The encryption implementation uses:

```text
AES-256-GCM
```

with a dedicated encryption key configured through the environment.

The application never stores GitHub access tokens in plaintext.

---

# Multi-User Data Isolation

Trace treats user ownership as a first-class backend security boundary.

User-specific resources include:

* Repositories
* Investigations
* Notifications
* Settings
* API keys
* Semantic chunks
* GitHub connections

Protected backend queries explicitly scope data to the authenticated user.

For example, investigation reads are resolved through the repository owner:

```sql
SELECT ...
FROM investigations i
JOIN repositories r
  ON r.id = i.repository_id
WHERE i.id = $1
  AND r.owner_user_id = $2;
```

This prevents one authenticated account from retrieving another account's investigation data even if the resource identifier is known.

Frontend query-cache isolation is also applied when the authenticated account changes.

---

# API Key Management

Trace supports application API-key generation from the settings area.

Generated keys follow the format:

```text
trace_sk_live_...
```

Only a hash of the API key is persisted.

The plaintext key is returned only at creation/rotation time.

The stored representation contains:

* Key hash
* Last four characters

This allows the UI to display a masked representation without exposing the complete credential.

---

# Notifications

Trace can create notifications for significant risk findings.

For example:

```text
HIGH risk detected
repository #42: Review this change.
```

Notifications are scoped to their owning user.

Users can retrieve notifications and mark individual notifications as read.

---

# Risk Thresholds

The application supports configurable risk thresholds.

Available settings include:

### Analysis depth

```text
fast
standard
deep
```

### Risk threshold

A value from:

```text
0 - 100
```

### High-risk notifications

Can be enabled or disabled.

An investigation can require review when the highest detected risk reaches the configured threshold or when verification gaps exist.

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* TanStack Router
* TanStack React Query
* TanStack Start
* Tailwind CSS
* Radix UI
* Lucide React
* Recharts
* React Hook Form
* Zod

The frontend package is configured as a TypeScript-based Vite application and uses TanStack Router/Start for application routing and React Query for server-state management.

---

## Backend

* Node.js
* TypeScript
* Express
* PostgreSQL
* pg
* WebSocket (`ws`)
* Zod
* OpenRouter

The backend is an Express application written in TypeScript and runs as an ES module.

---

## AI

Trace uses OpenRouter for:

* Primary AI analysis
* Investigation questions
* Semantic embeddings

The model and embedding model are configurable through environment variables.

---

## Database

PostgreSQL is used as the primary persistence layer.

The application stores information for:

* Users
* Sessions
* GitHub connections
* Repositories
* Investigations
* Analysis events
* Notifications
* Application settings
* Semantic chunks

Vector embeddings are stored using PostgreSQL vector support.

---

# Project Structure

```text
ai-project-trace/
│
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── ai.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── github.ts
│   │   ├── migrate.ts
│   │   ├── rate-limit.ts
│   │   ├── realtime.ts
│   │   ├── request-context.ts
│   │   ├── semantic.ts
│   │   ├── server.ts
│   │   └── settings.ts
│   │
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

# Local Development

## Prerequisites

Install:

* Node.js
* npm
* PostgreSQL
* A GitHub OAuth application
* An OpenRouter API key

A PostgreSQL database with vector support is required for semantic retrieval.

---

# 1. Clone the Repository

```bash
git clone https://github.com/mdShakil2004/ai-project-trace.git

cd ai-project-trace
```

---

# 2. Configure the Backend

```bash
cd backend
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required values.

Example:

```env
PORT=8787

DATABASE_URL=postgresql://user:password@localhost:5432/trace
DB_POOL_MAX=10

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_analysis_model
OPENROUTER_EMBEDDING_MODEL=your_embedding_model

AI_MAX_CONTEXT_CHARS=180000

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GITHUB_TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key

CORS_ORIGIN=http://localhost:8080
FRONTEND_URL=http://localhost:8080
APP_URL=http://localhost:8787

NODE_ENV=development

REALTIME_SECRET=your_random_realtime_secret
```

Do not commit `.env` or any real credentials.

---

# 3. Generate the GitHub Token Encryption Key

The GitHub token encryption key must decode to exactly 32 bytes.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Put the generated value into:

```env
GITHUB_TOKEN_ENCRYPTION_KEY=...
```

---

# 4. Configure GitHub OAuth

Create a GitHub OAuth application.

For local development, configure the callback URL as:

```text
http://localhost:8787/api/v1/auth/github/callback
```

Then configure:

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Trace requests the GitHub OAuth scope required for repository analysis, including repository access.

---

# 5. Install Backend Dependencies

```bash
cd backend
npm install
```

---

# 6. Initialize the Database

Run:

```bash
npm run db:migrate
```

This initializes the Trace database schema.

The migration command initializes both the core application database and authentication-related tables.

---

# 7. Start the Backend

Development mode:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:8787
```

Health endpoint:

```text
GET /api/v1/health
```

Expected response:

```json
{
  "ok": true,
  "database": "connected"
}
```

---

# 8. Install Frontend Dependencies

In another terminal:

```bash
cd frontend
npm install
```

---

# 9. Start the Frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:8080
```

The backend CORS configuration should allow the frontend origin:

```env
CORS_ORIGIN=http://localhost:8080
```

---

# Production Build

## Backend

```bash
cd backend

npm install
npm run build
npm start
```

The backend TypeScript project compiles into the production `dist` output and starts with Node.js.

---

## Frontend

```bash
cd frontend

npm install
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# Backend API

The primary API namespace is:

```text
/api/v1
```

---

## Authentication

### Sign Up

```http
POST /api/v1/auth/signup
```

### Login

```http
POST /api/v1/auth/login
```

### Current User

```http
GET /api/v1/auth/me
```

### Logout

```http
POST /api/v1/auth/logout
```

### GitHub OAuth

```http
GET /api/v1/auth/github
```

### GitHub OAuth Callback

```http
GET /api/v1/auth/github/callback
```

---

# Investigations

### Create Investigation

```http
POST /api/v1/investigations
```

Request:

```json
{
  "pull_request_url": "https://github.com/owner/repository/pull/123"
}
```

The endpoint creates an investigation and starts the asynchronous analysis pipeline.

---

### Get Investigation

```http
GET /api/v1/investigations/:id
```

---

### Get Changes

```http
GET /api/v1/investigations/:id/changes
```

---

### Get Architecture

```http
GET /api/v1/investigations/:id/architecture
```

---

### Get Risks

```http
GET /api/v1/investigations/:id/risks
```

---

### Get Verification

```http
GET /api/v1/investigations/:id/verification
```

---

### Get Evidence

```http
GET /api/v1/investigations/:id/evidence
```

---

### Get Files

```http
GET /api/v1/investigations/:id/files
```

---

### Get Analysis Events

```http
GET /api/v1/investigations/:id/events
```

---

### Ask a Question

```http
POST /api/v1/investigations/:id/questions
```

Example:

```json
{
  "question": "What is the highest risk introduced by this change?"
}
```

The question-answering flow uses the investigation evidence and semantic context rather than treating the repository as an unrestricted instruction source.

---

# Repositories

### List Repositories

```http
GET /api/v1/repositories
```

### Add Repository

```http
POST /api/v1/repositories
```

### Get Repository

```http
GET /api/v1/repositories/:id
```

### Browse GitHub Repositories

```http
GET /api/v1/github/repositories
```

### Browse Pull Requests

```http
GET /api/v1/github/repositories/:owner/:repo/pulls
```

---

# Dashboard

### Overview

```http
GET /api/v1/overview
```

The overview provides aggregate information such as:

* Total investigations
* High-risk changes
* Verification gaps
* Average analysis time
* Risk distribution

All overview information is scoped to the authenticated account.

---

# Settings

### Get Settings

```http
GET /api/v1/settings
```

### Update Settings

```http
PUT /api/v1/settings
```

### Rotate API Key

```http
POST /api/v1/settings/api-key/rotate
```

---

# Notifications

### List Notifications

```http
GET /api/v1/notifications
```

### Mark Notification as Read

```http
PATCH /api/v1/notifications/:id/read
```

---

# Security Model

Security is treated as part of the application architecture rather than a frontend-only concern.

## Authentication

Sessions are stored in HttpOnly cookies.

## Password Security

Passwords are hashed using `scrypt`.

## GitHub Credentials

GitHub OAuth access tokens are encrypted using AES-256-GCM before persistence.

## User Isolation

Protected resources are explicitly scoped to the authenticated user's ID.

## API Keys

API keys are stored as SHA-256 hashes rather than plaintext.

## Realtime Security

WebSocket investigation tokens are:

* Short-lived
* HMAC signed
* Bound to an investigation
* Bound to a user

## Repository Content

Repository content is treated as untrusted data by the AI question-answering layer.

Repository text is not treated as system instructions.

---

# Rate Limiting

Trace includes rate limiting for sensitive and potentially expensive operations.

Current limits include:

### Authentication

Sign-up, login, and GitHub OAuth flows are rate limited by IP.

### Analysis

Investigation creation is rate limited per authenticated user.

### Questions

Investigation questions are rate limited per authenticated user.

This helps control accidental abuse and protects expensive AI/GitHub operations.

---

# Error Handling

The backend uses structured API errors.

Example:

```json
{
  "error": {
    "code": "GITHUB_AUTH_REQUIRED",
    "message": "GitHub authorization is required."
  }
}
```

Common error categories include:

```text
UNAUTHORIZED
INVALID_PULL_REQUEST_URL
INVALID_REPOSITORY_URL
GITHUB_AUTH_REQUIRED
GITHUB_PERMISSION_DENIED
GITHUB_REPOSITORY_NOT_FOUND
GITHUB_RATE_LIMITED
AI_EMPTY_RESPONSE
AI_INVALID_JSON
AI_SCHEMA_VALIDATION_FAILED
EMBEDDING_PROVIDER_ERROR
ANALYSIS_IN_PROGRESS
ANALYSIS_FAILED
```

This allows the frontend to distinguish user-facing failures from internal failures.

---

# Design Principles

Trace follows several engineering principles.

## Evidence over speculation

AI output should be grounded in actual repository and investigation context.

## Backend-enforced authorization

The frontend is never treated as the security boundary.

## Explicit ownership

Every persistent user-owned resource has a clear ownership path.

## Graceful degradation

Semantic retrieval is an optimization. Core analysis should not become unusable simply because embeddings are unavailable.

## Async by default for expensive work

Large GitHub retrieval and AI analysis are performed asynchronously.

## Realtime UX

Long-running operations expose progress rather than leaving users staring at a loading screen.

## Configurable analysis

Risk sensitivity and analysis depth are configurable instead of hardcoded.

---

# AI Safety and Reliability

Trace is designed to reduce several common problems with AI-assisted engineering analysis.

### Repository content is untrusted

Code, comments, commit messages, and documentation may contain arbitrary text.

The AI layer therefore treats repository content as data rather than instructions.

### No unsupported citations

Investigation questions can only return citation identifiers that correspond to supplied evidence.

### Structured AI output

The backend validates AI responses against schemas before returning them to the frontend.

### Confidence

Question responses include a confidence value.

### Unknowns

The AI response format explicitly supports unknowns so the system can communicate when the available evidence is insufficient.

---

# Development Guidelines

When adding new backend endpoints:

1. Authenticate the request.
2. Resolve the current user.
3. Explicitly scope database reads to that user.
4. Verify ownership before mutating resources.
5. Never rely solely on IDs supplied by the client.
6. Avoid returning internal credentials or secrets.
7. Validate request payloads.
8. Return structured errors.

When adding frontend server-state queries:

1. Use stable query keys.
2. Scope cached data to the current account where appropriate.
3. Clear/invalidate user-owned queries after authentication changes.
4. Avoid showing stale data during account switches.
5. Handle `401` responses consistently.

---

# Testing the Multi-Account Boundary

A basic security regression test should always verify that data does not cross accounts.

### Account A

```text
Create account
↓
Connect GitHub
↓
Analyze PR
↓
Verify investigation appears
```

### Account B

```text
Create/login as different account
↓
Open dashboard
↓
Verify Account A investigation is absent
↓
Create Account B investigation
```

### Switch back to Account A

```text
Account A
↓
Only Account A's repositories
↓
Only Account A's investigations
↓
Only Account A's notifications
```

The same test should be performed with:

* Direct investigation URLs
* Repository IDs
* Notification IDs
* Realtime WebSocket connections
* Investigation questions

---

# Performance Considerations

Trace performs several potentially expensive operations:

* GitHub API calls
* Large PR diff retrieval
* Embedding generation
* Vector search
* LLM analysis

The architecture therefore separates:

```text
Request acceptance
        ↓
Investigation persistence
        ↓
Asynchronous analysis
        ↓
Realtime progress
        ↓
Persisted result
```

This prevents the initial API request from having to wait for the entire AI pipeline.

---

# Environment Variables

The backend currently supports the following configuration:

| Variable                      | Purpose                           |
| ----------------------------- | --------------------------------- |
| `PORT`                        | Backend HTTP port                 |
| `DATABASE_URL`                | PostgreSQL connection string      |
| `DB_POOL_MAX`                 | PostgreSQL connection pool size   |
| `OPENROUTER_API_KEY`          | OpenRouter API credential         |
| `OPENROUTER_MODEL`            | Primary analysis model            |
| `OPENROUTER_EMBEDDING_MODEL`  | Embedding model                   |
| `AI_MAX_CONTEXT_CHARS`        | Maximum AI context size           |
| `GITHUB_CLIENT_ID`            | GitHub OAuth client ID            |
| `GITHUB_CLIENT_SECRET`        | GitHub OAuth client secret        |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for GitHub tokens |
| `CORS_ORIGIN`                 | Allowed frontend origin(s)        |
| `FRONTEND_URL`                | Frontend URL used after OAuth     |
| `APP_URL`                     | Backend/application URL           |
| `NODE_ENV`                    | Runtime environment               |
| `REALTIME_SECRET`             | HMAC secret for realtime tokens   |

The repository includes a backend `.env.example` with these configuration variables.

---

# Troubleshooting

## Backend cannot connect to PostgreSQL

Verify:

```env
DATABASE_URL=...
```

Then run:

```bash
npm run db:migrate
```

---

## GitHub OAuth fails

Verify:

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

And make sure the GitHub OAuth callback URL matches:

```text
http://localhost:8787/api/v1/auth/github/callback
```

---

## Frontend cannot call the backend

Verify:

```env
CORS_ORIGIN=http://localhost:8080
FRONTEND_URL=http://localhost:8080
```

Then restart the backend.

---

## Semantic retrieval is unavailable

Check:

```env
OPENROUTER_API_KEY=...
OPENROUTER_EMBEDDING_MODEL=...
```

Semantic retrieval is optional to the core analysis flow, so a temporary embedding failure should not necessarily prevent an investigation from completing.

---

## Realtime progress does not appear

Verify:

```env
REALTIME_SECRET=...
```

The secret must be configured consistently for the backend process.

Also verify that the frontend connects to the same backend host and that the WebSocket endpoint is reachable.

---

# Production Checklist

Before deploying Trace to production:

* [ ] Configure a production PostgreSQL database.
* [ ] Enable PostgreSQL vector support.
* [ ] Configure production `DATABASE_URL`.
* [ ] Configure a production OpenRouter API key.
* [ ] Configure the production GitHub OAuth application.
* [ ] Generate a unique 32-byte GitHub token encryption key.
* [ ] Generate a strong realtime signing secret.
* [ ] Configure the production frontend origin.
* [ ] Configure HTTPS.
* [ ] Verify secure cookies are enabled.
* [ ] Run database initialization/migrations.
* [ ] Build the frontend.
* [ ] Build the backend.
* [ ] Verify `/api/v1/health`.
* [ ] Test GitHub OAuth.
* [ ] Test public repository analysis.
* [ ] Test private repository analysis.
* [ ] Test account isolation.
* [ ] Test realtime analysis.
* [ ] Test notification isolation.
* [ ] Test direct access to another user's investigation ID.
* [ ] Confirm secrets are not committed to Git.

---

# Current Scope

Trace currently focuses on GitHub Pull Request–based change intelligence.

The core workflow covers:

```text
GitHub PR
    ↓
Context collection
    ↓
AI analysis
    ↓
Risk assessment
    ↓
Evidence
    ↓
Verification
    ↓
Engineering review
```

The architecture is intentionally designed so additional analysis sources and engineering workflows can be added without replacing the core investigation model.

---

# Why Trace?

Traditional code review is heavily dependent on engineers manually reconstructing context.

A reviewer may need to:

* Read the PR description.
* Inspect dozens of changed files.
* Search previous commits.
* Read issues and comments.
* Understand service relationships.
* Determine potential blast radius.
* Inspect CI results.
* Decide whether the change is sufficiently tested.

Trace brings those signals together and uses AI to help organize them into an investigation that an engineer can review.

The goal is not to replace engineering judgment.

The goal is to make that judgment faster, better informed, and easier to verify.

---

# Product Philosophy

Trace is built around a simple principle:

> **AI can generate changes quickly. Engineers still need to understand and verify those changes.**

Trace exists in the layer between code generation and production deployment.

```text
              AI Code Generation
                      │
                      ▼
              ┌───────────────┐
              │     Trace     │
              │               │
              │ Understand    │
              │ Investigate   │
              │ Assess Risk   │
              │ Verify        │
              └───────┬───────┘
                      │
                      ▼
              Engineering Review
                      │
                      ▼
                   Deploy
```

---

# License

This project is currently maintained as a private project.

License and distribution terms should be added before public distribution.

---

# Status

Trace is under active development.

The current implementation includes the core authenticated investigation workflow, GitHub integration, AI analysis, semantic retrieval, realtime progress, risk assessment, verification analysis, notifications, settings, and multi-account data isolation.

```

### One change I recommend

I would **not** put deployment URLs, database credentials, API keys, or temporary assignment-specific information into this README. Keep this README focused on the product, architecture, setup, API, security, and engineering decisions.

Also, I deliberately didn't claim things like **“100% accurate AI analysis,” “production-ready at massive scale,” “zero data leakage,”** or unsupported performance numbers. Those are claims the current code doesn't establish.

The README's stack and configuration are based on the actual repository files, including the frontend package configuration and backend environment configuration.  
```
