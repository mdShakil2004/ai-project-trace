# Trace Frontend Workflow Contract

This document is the backend-facing source of truth for the existing Trace frontend. Backend work must satisfy this contract rather than redesigning the UI.

## Product interaction model

Trace is an evidence-backed PR investigation product. The frontend does not want a generic chat response or one giant AI blob. It expects a structured investigation that can be explored section-by-section and traced back to evidence.

Core equation shown by the UI:

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

The sidebar labels are Overview, Investigate PR, Investigations and Repositories. Settings is a secondary workspace action.

## Primary end-to-end workflow

1. User lands on Overview.
2. Overview loads metrics and recent investigations.
3. User selects `Analyze a Pull Request`.
4. Analyze screen accepts a GitHub PR URL. Demo/default URL is `https://github.com/acme/payments-api/pull/482`.
5. Frontend calls `POST /investigations` through `api.analyzePullRequest()`.
6. API immediately returns an investigation id and queued/running status.
7. Analyze UI displays an eight-stage progress workflow:
   - Connecting to GitHub
   - Fetching pull request
   - Reading changed files
   - Mapping dependencies
   - Recovering historical context
   - Assessing architectural impact
   - Identifying risks
   - Checking verification
8. On completion the frontend navigates to `/investigation/$id`.
9. Investigation header shows repository, PR number/title, author, head -> base branch, additions/deletions, analysis duration, status, risk and GitHub link.
10. Investigation has eight tabs:
    - Overview
    - What Changed
    - Why
    - Architecture
    - Risk
    - Verification
    - Evidence
    - Files
11. A persistent right-side `Trace Intelligence` panel shows prioritized review actions and supports contextual questions.
12. Evidence can be opened from conclusions, changes, risks, why-chain, architecture conclusions and questions.
13. Files tab renders real diff hunks with line numbers and supports `Explain this change` navigation back to What Changed.
14. Investigation history must include the completed run.
15. Dashboard/repository metrics must reflect persisted investigations.

## Overview contract

`GET /overview` supplies:

- investigations `{ value, delta }`
- highRisk `{ value, delta }`
- verificationGaps `{ value, delta }`
- avgAnalysis `{ value, delta }`
- riskDistribution `{ low, medium, high, critical }`

`GET /investigations` supplies recent investigation summaries. Overview renders up to six and navigates to `/investigation/$id`.

## Investigation summary contract

The frontend type is `InvestigationSummary`:

- id
- repository
- repositoryId
- pullRequest
  - number
  - title
  - author
  - openedAt
  - headBranch
  - baseBranch
  - url
  - additions
  - deletions
- risk
  - level: low | medium | high | critical
  - confidence: 0..1
  - primaryConcern
- status: verified | review | analyzing | failed | partial
- filesChanged
- servicesAffected
- newDependencies
- verificationChecks
- verificationGaps
- riskCount
- analysisSeconds
- analyzedAt

The database may use its own normalized status values (`queued`, `fetching`, `analyzing`, `completed`, `partial`, `failed`), but the API must map those into the frontend's display status semantics.

## Full investigation contract

`GET /investigations/:id` must provide the full `Investigation` object, not merely database metadata.

It contains:

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

The frontend currently performs one primary investigation query and expects the nested data to be directly usable by all eight tabs.

## Overview tab

Displays:

- headline
- executive summary bullets
- files changed
- services affected
- new dependencies
- verification gaps
- primary concern
- risk level
- risk confidence
- architecture AI conclusion

The conclusion must contain:

- title
- confidence
- statement
- evidenceIds
- unknowns

## What Changed tab

Each `Change` contains:

- id
- kind: added | modified | removed
- title
- detail
- components[]
- files[]
- evidenceIds[]

Each evidence id is clickable and opens the evidence drawer.

## Why tab

`WhyAnalysis` contains:

- question
- chain[]
- interpretation
- confidence
- evidenceStrength
- unknowns[]

Each reasoning-chain item contains:

- id
- label
- ref
- detail
- date
- optional evidenceId

The backend must not fabricate intent. If historical evidence is insufficient, the `unknowns` field and confidence must communicate that.

## Architecture tab

`Architecture` contains:

### nodes
Each node:

- id
- label
- kind: service | datastore | api | worker | external
- changed
- column
- row
- references
- changedFunctions
- incoming
- outgoing
- note

### edges
Each edge:

- id
- from
- to
- optional label
- kind: read | write | invalidate | call
- added

The frontend uses `column` and `row` for deterministic visualization layout. Backend should calculate stable values; it should not require the frontend to infer layout.

### blastRadius
Each entry:

- component
- level: direct | indirect | potential
- reason

### conclusion
Standard AI conclusion shape described above.

## Risk tab

Each `Risk` contains:

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

The UI expects risks to be evidence-linked and location-aware. File/line references must never be invented.

Risk levels are low, medium, high and critical.

## Verification tab

`Verification` contains:

- checks[]
- recommended[]
- conclusion

Each check:

- id
- name
- status: passed | failed | missing | partial
- detail
- source
- optional durationMs

Each recommended test:

- id
- title
- rationale
- steps[]
- scenario

The UI copies the scenario as a test specification. It must be grounded in the identified risk/verification gap.

The backend must never claim a test passed unless actual evidence was retrieved.

## Evidence model

`Evidence` is a first-class UI object.

Fields:

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
- optional lines `[start,end]`
- optional url

Evidence is displayed in cards and an evidence drawer. The drawer shows source, kind, author, date, file/line location, relevance strength, excerpt and a GitHub source link.

Evidence IDs are the join mechanism used throughout changes, conclusions, risks, why-chain and question answers.

## Files / diff model

Each `ChangedFile` contains:

- path
- status: added | modified | deleted
- additions
- deletions
- language
- summary
- hunks[]

Each hunk:

- header
- lines[]

Each diff line:

- type: context | add | del
- oldLine nullable
- newLine nullable
- content

The backend should return real GitHub patch-derived data for real mode. For demo mode it must use the deterministic payment-status fixture.

## Trace Intelligence panel

The right-side intelligence panel is contextual, not a generic chatbot.

It renders `priorities[]` first. Each priority has:

- title
- note
- tab

Clicking a priority changes the investigation tab.

Question suggestions currently include:

- Why is this medium risk?
- What changed architecturally?
- Show me the strongest evidence.
- What would you test first?
- What assumptions did this PR introduce?

Questions are sent to:

`POST /investigations/:id/questions`

Request:

`{ question: string }`

Response:

- question
- answer
- confidence
- citations[] `{ evidenceId, label }`
- unknowns[]

Answers must cite actual evidence IDs so the frontend can open the corresponding evidence drawer.

## Repository workflow

`GET /repositories` powers the repository cards and workspace sidebar.

Repository fields required by UI:

- id
- name
- fullName
- url
- defaultBranch
- language
- investigations
- highRiskChanges
- verificationGaps
- riskDistribution
- frequentServices[] `{ name, touches }`
- commonRiskCategories[] `{ name, count }`
- lastAnalyzedAt

`GET /repositories/:id` provides the same repository intelligence plus recent investigations.

Repository detail filters investigations by `repositoryId` and links each run to the investigation workspace.

## Settings workflow

Current settings UI has local state for:

- analysis depth: fast | standard | deep
- risk threshold: 0..100
- high/critical notifications on/off

It also shows a GitHub connection state and API access display. These settings are currently UI-only and are not yet part of the critical investigation API contract. Backend should not invent persistent behavior for them without explicit integration work.

## Current navigation/data dependencies

AppShell currently reads repository data for:

- workspace sidebar
- top repository selector
- GitHub connected indicator

The backend must eventually replace this hard-coded repository source with `GET /repositories` while preserving the same UX.

## Frontend data-loading behavior

The app uses TanStack React Query with route loaders.

Important query keys:

- `overview-metrics`
- `investigations`
- `repository/:id`
- `investigation/:id`

A backend change must preserve stable response shapes so React Query loaders can hydrate the screens without UI-specific transformations.

## Required API surface

Critical:

- `GET /overview`
- `GET /investigations`
- `POST /investigations`
- `GET /investigations/:id`
- `POST /investigations/:id/questions`
- `GET /repositories`
- `GET /repositories/:id`

Existing service abstraction also defines:

- `GET /investigations/:id/changes`
- `GET /investigations/:id/architecture`
- `GET /investigations/:id/risks`
- `GET /investigations/:id/verification`
- `GET /investigations/:id/evidence`
- `GET /investigations/:id/files`
- `GET /investigations/:id/events`

These section endpoints should return the exact corresponding frontend object shapes.

## Demo fixture contract

The primary demo is:

- repository: `acme/payments-api`
- PR: `#482`
- title: `Add Redis caching to payment status API`
- 8 changed files
- 149 additions
- 12 deletions
- 3 affected services
- 2 new dependencies
- medium overall risk
- 82% reasoning confidence
- primary concern: stale payment status after asynchronous refund updates

Core evidence IDs are `ev_1` through `ev_9` and must remain stable in demo mode because the frontend uses them as cross-section references.

The demo should reproduce the existing `src/data/investigations.ts` model, not generate a new approximation.

## Backend implementation implications

1. Normalize persistence, but expose the frontend-shaped DTO at the API boundary.
2. Keep evidence IDs stable within an investigation.
3. Preserve file/line references for code evidence and risk locations.
4. Keep architecture node/edge IDs stable within an investigation.
5. Treat `unknowns` as a first-class output, not an error.
6. Map backend analysis lifecycle to frontend status values.
7. Progress events should drive the eight visible analysis stages rather than a frontend-only timer.
8. A completed investigation must be navigable immediately and independently of the analysis process.
9. Real mode must fetch GitHub data; demo mode must be deterministic.
10. Do not expose raw GitHub tokens or OpenAI credentials.
11. Do not make the frontend reconstruct AI reasoning from raw database rows.
12. Do not turn the Intelligence panel into an unrestricted repository chatbot; answers must be scoped to the investigation evidence.
