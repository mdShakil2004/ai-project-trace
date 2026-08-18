# Trace Frontend Workflow Contract

This document is the backend-facing source of truth for the existing Trace frontend. Backend work must satisfy this contract rather than redesigning the UI.

## Product interaction model

Trace is an evidence-backed PR investigation product. The frontend expects a structured investigation that can be explored section-by-section and traced back to evidence.

Core equation:

`Observed + Inferred + Evidence + Unknowns + Verification = Engineering decision`

Every important conclusion is rendered as:

`Conclusion -> Confidence -> Evidence -> Unknowns`

## Application routes

- `/` — Overview/dashboard
- `/analyze` — Analyze a GitHub pull request
- `/investigations` — investigation history/search/filter
- `/investigation/$id` — complete investigation workspace
- `/repositories` — connected repository list
- `/repositories/$id` — repository intelligence/history
- `/settings` — GitHub connection and analysis preferences

## Primary end-to-end workflow

1. User lands on Overview.
2. Overview loads metrics and recent investigations from the API.
3. User selects `Analyze a Pull Request`.
4. Analyze screen accepts a GitHub PR URL supplied by the user.
5. Frontend calls `POST /investigations` through `api.analyzePullRequest()`.
6. API returns an investigation id and queued/running status.
7. Analyze UI displays the eight-stage progress workflow.
8. Realtime events drive progress; the frontend must not simulate analysis with a local timer or fixture.
9. On completion the frontend navigates to `/investigation/$id`.
10. Investigation history, dashboard metrics and repository metrics must reflect persisted backend data.

## Investigation contract

`GET /investigations/:id` provides the full `Investigation` object:

- all summary fields
- `headline`
- `executiveSummary[]`
- `changes[]`
- `why`
- `architecture`
- `risks[]`
- `evidence[]`
- `verification`
- `files[]`
- `priorities[]`

The frontend expects the nested data to be directly usable by the investigation tabs.

## Investigation summary

`InvestigationSummary` contains:

- id
- repository
- repositoryId
- pullRequest: number, title, author, openedAt, headBranch, baseBranch, url, additions, deletions
- risk: level, confidence, primaryConcern
- status: verified | review | analyzing | failed | partial
- filesChanged
- servicesAffected
- newDependencies
- verificationChecks
- verificationGaps
- riskCount
- analysisSeconds
- analyzedAt

The API maps persistence statuses into these frontend display statuses.

## Investigation tabs

The workspace contains:

- Overview
- What Changed
- Why
- Architecture
- Risk
- Verification
- Evidence
- Files

Evidence IDs are the join mechanism across changes, conclusions, risks, why-chain and question answers.

## Evidence requirements

Evidence is a first-class object with:

- id
- kind: pull_request | issue | commit | code | docs | test
- ref
- title
- strength: direct | strong | moderate | weak
- source
- author
- date
- excerpt
- optional file
- optional lines
- optional url

The backend must return evidence derived from the analyzed repository/PR context. The frontend must never invent evidence, file locations, line numbers, risks, verification results or AI conclusions.

## Files / diff model

`ChangedFile` contains:

- path
- status: added | modified | deleted
- additions
- deletions
- language
- summary
- hunks[]

Diff lines contain type, oldLine, newLine and content. Real GitHub patch-derived data is required for every investigation.

## Architecture

`Architecture` contains stable nodes and edges plus blast-radius entries and an AI conclusion. The backend calculates deterministic `column` and `row` values for visualization layout; the frontend does not infer architecture from arbitrary mock structures.

## Risk

Each risk contains:

- id
- title
- level
- category
- description
- affectedComponents[]
- evidenceIds[]
- locations[] with `{ file, line }`
- mitigation
- confidence

File/line references must come from analyzed repository evidence.

## Verification

`Verification` contains checks, recommended tests and a conclusion.

Each check has status `passed | failed | missing | partial`. The backend must never claim a test passed unless actual evidence was retrieved.

## Trace Intelligence

The right-side intelligence panel is contextual, not a generic chatbot. It renders backend-provided `priorities[]` and sends questions to:

`POST /investigations/:id/questions`

Question answers must cite actual evidence IDs and expose unknowns where evidence is insufficient.

## Repository workflow

`GET /repositories` powers repository cards, the workspace sidebar and repository selection.

`GET /repositories/:id` provides repository intelligence plus recent investigations.

All repository metrics are backend-derived. The frontend must not seed repositories or investigation counts locally.

## Settings workflow

Settings are loaded from `GET /settings` and persisted through `PUT /settings`. The frontend must not initialize user-visible settings from fabricated product values. Loading state is distinct from a real backend value.

## Frontend data-loading behavior

The app uses TanStack React Query with route loaders. Important query keys include:

- `overview-metrics`
- `investigations`
- `repository/:id`
- `investigation/:id`
- `repositories`
- `github-connection`
- `current-user`
- `settings`
- `notifications`

Shared query keys must keep a consistent response shape across components. Components should consume the API/React Query layer rather than maintaining duplicated server state.

## Required API surface

Critical:

- `GET /overview`
- `GET /investigations`
- `POST /investigations`
- `GET /investigations/:id`
- `POST /investigations/:id/questions`
- `GET /repositories`
- `GET /repositories/:id`

Investigation section endpoints:

- `GET /investigations/:id/changes`
- `GET /investigations/:id/architecture`
- `GET /investigations/:id/risks`
- `GET /investigations/:id/verification`
- `GET /investigations/:id/evidence`
- `GET /investigations/:id/files`
- `GET /investigations/:id/events`

## Non-negotiable data rule

There is no demo mode, fixture mode or frontend mock-data path in the application.

All user-visible product data must originate from the authenticated backend, the user's GitHub data, persisted investigation records, or the configured AI/semantic-analysis services. Empty states are valid application states and must be rendered instead of substituting sample data.

Do not add `mockApi`, fixture datasets, hard-coded repository metrics, fabricated investigations, deterministic demo PRs, fake evidence IDs, fake analysis progress, or default user settings.

## Backend implementation implications

1. Normalize persistence but expose frontend-shaped DTOs at the API boundary.
2. Keep evidence IDs stable within each persisted investigation.
3. Preserve real file/line references.
4. Keep architecture node/edge IDs stable within an investigation.
5. Treat `unknowns` as a first-class output.
6. Map backend lifecycle states to frontend statuses.
7. Progress events must drive the visible analysis stages.
8. Completed investigations must remain independently retrievable.
9. Real GitHub data must be used for every analysis.
10. Do not expose raw GitHub tokens or AI credentials.
11. Do not make the frontend reconstruct AI reasoning from raw database rows.
12. Keep Intelligence answers scoped to the current investigation evidence.
