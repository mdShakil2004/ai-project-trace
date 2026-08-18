# Trace Intelligence

Build Trace — AI Change Intelligence

Build the complete frontend for a production-quality developer tool called Trace.

Trace is an AI Change Intelligence platform for engineers working with AI-generated code and large repositories.

1. Product

Product name

Trace

Tagline

Understand the change. Verify the reasoning. Ship with confidence.

One-line product description

Trace analyzes a GitHub pull request and explains:

what changed

why it changed

what parts of the system are affected

what risks the change introduces

what evidence supports the conclusions

what has been verified

what still needs to be verified

The core product idea is:

AI has made code generation cheaper, but understanding and validating large AI-generated changes remains expensive.

Trace is not a generic AI code reviewer.

It is an evidence-backed change intelligence and verification layer between AI-generated code and human approval.

2. Important product positioning

Do NOT make this look like:

a generic SaaS dashboard

ChatGPT clone

generic AI code reviewer

generic GitHub analytics dashboard

generic project management software

It should feel like a serious developer infrastructure product similar in quality and density to products such as Linear, Vercel, GitHub, Sentry, or modern developer observability tools.

The UI should communicate:

analysis + evidence + architecture + risk + verification

rather than simply:

AI + chat

The primary experience is an investigation workspace.

3. Tech requirements

Use:

React / Next.js style architecture if supported

TypeScript

Tailwind CSS

shadcn/ui or equivalent high-quality component system

Lucide icons

responsive design

reusable components

clean component architecture

realistic mock data

API abstraction layer so the frontend can later connect to FastAPI

Do not hardcode data directly inside every page component.

Create a centralized mock/API service layer.

Example:

src/
  components/
  pages/
  layouts/
  hooks/
  services/
    api.ts
    mockApi.ts
  types/
  data/
  lib/


The frontend must be easy to connect to a FastAPI backend later.

4. Visual direction

Use a sophisticated dark developer-tool aesthetic.

Primary appearance

Dark mode should be the default.

Background:

very dark charcoal / near-black

subtle layered surfaces

restrained borders

excellent contrast

Do not make the UI excessively colorful.

Use color primarily for semantic meaning:

green = verified / healthy / low risk

amber = warning / medium risk

red = high risk / critical

blue/purple = AI analysis / intelligence

neutral gray = metadata

Avoid excessive gradients.

Avoid glassmorphism everywhere.

Avoid giant hero text.

Avoid unnecessary animations.

The product should look like something an engineering team could actually use every day.

5. Typography

Use a clean modern sans-serif for UI.

Use a monospace font for:

file names

code

commit hashes

branch names

line numbers

technical metadata

Hierarchy should be very clear.

The UI should remain readable when displaying dense engineering information.

6. Global application layout

Create a persistent application shell.

Desktop:

┌─────────────────────────────────────────────────────────────┐
│ Trace                                    Search   GitHub ◉ │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Trace        │                                             │
│               │                                             │
│  Overview     │                                             │
│  Investigate  │              MAIN CONTENT                   │
│  History      │                                             │
│               │                                             │
│  ───────────  │                                             │
│               │                                             │
│  Workspace    │                                             │
│  Repository   │                                             │
│               │                                             │
│  ───────────  │                                             │
│               │                                             │
│  Settings     │                                             │
│               │                                             │
│  Shakil       │                                             │
└───────────────┴─────────────────────────────────────────────┘


Sidebar:

Trace logo

Overview

Investigate PR

Investigations

Repositories

Settings

Bottom:

GitHub connection status

user profile

Top navigation:

global search

repository selector

GitHub connection indicator

notifications

user avatar

Sidebar should collapse on smaller screens.

7. Page 1 — Landing / Overview

Route:

/


This is the initial product dashboard.

Do not make it a marketing landing page.

It should immediately show the product after login.

Header:

Good afternoon, Shakil

Understand what changed before you approve it.


Primary CTA:

Analyze a Pull Request

Secondary CTA:

Connect GitHub

Overview metrics

Display four cards:

Investigations

128
+18 this week


High-risk changes

7
2 require attention


Verification gaps

23
↓ 14% this week


Avg. analysis time

42 sec
↓ 8 sec


Keep these metrics believable.

Do not use absurd numbers.

8. Recent investigations

Table:

Recent investigations

PR       Repository       Change                    Risk       Status
#482     payments-api     Add Redis caching         Medium     Verified
#479     checkout         Retry payment requests   High       Review
#477     auth-service     JWT rotation             Low        Verified
#471     orders           Event batching           Medium     Review


Columns:

PR

Repository

Title

Author

Risk

Verification

Time

Status

Rows should be clickable.

Clicking a row opens:

/investigation/:id


9. Risk distribution

Create a compact visualization:

Risk distribution

Low       █████████████████
Medium    ████████
High      ███
Critical  █


Use a subtle chart.

Do not make the dashboard feel like a BI analytics product.

10. Page 2 — Analyze PR

Route:

/analyze


This is the main entry point.

Header:

Analyze a Pull Request

Subtitle:

Give Trace a GitHub PR and we'll reconstruct the change, its intent, impact, and verification gaps.

Input:

GitHub Pull Request URL

https://github.com/acme/payments/pull/482


Button:

Analyze PR

Optional:

Paste repository URL instead

11. Analyze loading experience

When user clicks Analyze PR, DO NOT immediately show a generic spinner.

Show a real analysis pipeline.

Example:

Analyzing payment-service #482

✓ Connecting to GitHub
✓ Fetching pull request
✓ Reading 8 changed files
✓ Mapping dependencies
● Recovering historical context
○ Assessing architectural impact
○ Identifying risks
○ Checking verification


Animate the current step subtly.

After completion:

Analysis complete
42 seconds


Then automatically navigate to the investigation page.

12. Page 3 — Investigation workspace

Route:

/investigation/:id


This is the most important page in the entire application.

Spend the majority of frontend effort here.

The page should feel like a high-quality engineering investigation workspace.

13. Investigation header

Example:

payments-api / Pull Request #482

Add Redis caching to payment status API

opened by alex
3 hours ago

feature/payment-cache → main


Right side:

MEDIUM RISK

Analysis complete
42 sec


Buttons:

Open GitHub PR

Re-run analysis

Share

More

14. Investigation summary

Create a horizontal summary:

8 files changed
3 services affected
2 new dependencies
4 verification checks
3 potential risks
82% reasoning confidence


These should be visually clean, not oversized.

15. Main investigation tabs

Create these tabs:

Overview
What Changed
Why
Architecture
Risk
Verification
Evidence
Files


The tabs should update the central content without losing the investigation context.

16. Overview tab

This should be the default.

Executive summary

Display:

What happened?

This PR introduces Redis caching for payment status lookups
to reduce repeated PostgreSQL reads.

The change affects PaymentService, WebhookHandler,
and the payment status API.

The main risk is cache invalidation because payment state
can also be modified asynchronously by webhook events.


Then show:

Risk

MEDIUM

Primary concern:
Potential stale payment status after asynchronous updates.

Confidence:
82%


17. "What Changed" section

Create a change breakdown.

Example:

WHAT CHANGED

+ Redis caching
+ Cache lookup before database query
+ Cache invalidation on payment update
~ PaymentService behavior modified
~ WebhookHandler modified


Each change should be expandable.

Clicking:

PaymentService.ts


opens a code/diff drawer.

18. Code diff viewer

Build a realistic developer code viewer.

Use Monaco if available; otherwise create a high-quality syntax-highlighted diff viewer.

Example:

PaymentService.ts

  38
  39  async getPaymentStatus(id) {
  40
+ 41    const cached = await redis.get(`payment:${id}`)
+ 42
+ 43    if (cached) {
+ 44      return JSON.parse(cached)
+ 45    }
  46
  47    const payment = await db.payment.findUnique(...)
+ 48    await redis.setex(...)
  49
  50    return payment
  51  }


Allow:

line highlighting

file navigation

expand/collapse

"Explain this change"

When clicking "Explain this change", open an intelligence panel.

19. "Why" tab

This is one of Trace's differentiating features.

Header:

Why was this change made?

Display an evidence-backed reasoning chain.

Example:

DATABASE LOAD
     │
     ▼
PR #218
High payment-status query volume
     │
     ▼
Issue #391
Reduce database read pressure
     │
     ▼
PR #482
Redis caching introduced


Then:

AI interpretation

The caching layer appears to have been introduced primarily to reduce repeated payment-status reads rather than to change payment-state behavior.

Show:

Confidence
82%

Evidence strength
Strong


20. Evidence cards

Each conclusion must be linked to evidence.

Example:

Evidence #1

PR #218
"Reduce payment status DB load"

2 months ago

Relevant excerpt...


Another:

Evidence #2

Commit 8fa92c1

Payment status query optimization

src/payment/PaymentService.ts


Clicking evidence opens a drawer with:

source

date

author

relevant text

file

line numbers

Do not make evidence look like generic citations.

It should feel like forensic engineering evidence.

21. Architecture tab

Create an interactive architecture visualization.

Example:

                    Payment API
                         │
                         ▼
                  PaymentService
                    /         \
                   /           \
                  ▼             ▼
              Redis         PostgreSQL
                ▲
                │
         Cache invalidation
                ▲
                │
         WebhookHandler


Use cards/nodes with subtle connecting lines.

Clicking a node should show:

PaymentService

8 references
3 changed functions
2 incoming dependencies
4 outgoing dependencies


Use a graph library if easy to implement.

If not, create a polished static interactive architecture map.

The architecture view is important because Trace is supposed to understand system impact, not just individual lines of code.

22. Blast radius

Under Architecture, show:

BLAST RADIUS

Directly affected
────────────────────────
PaymentService
WebhookHandler
PaymentStatusController

Indirectly affected
────────────────────────
OrderService
NotificationWorker

Potentially affected
────────────────────────
Analytics pipeline


Use three semantic levels.

Clicking each service should reveal why it is classified at that level.

23. Risk tab

Header:

Risk assessment

Overall:

MEDIUM RISK
82% confidence


Then risk cards.

Risk 1

Cache invalidation
MEDIUM

Payment status can be updated asynchronously by webhook
events. A stale cache could return outdated state.

Evidence:
WebhookHandler.ts:83
PaymentService.ts:41


Risk 2

Concurrency
LOW

Two simultaneous updates may produce inconsistent cache state.


Risk 3

Test coverage
MEDIUM

No integration test currently validates cache invalidation.


Each risk should include:

severity

explanation

evidence

affected components

recommended mitigation

24. Verification tab

This is another core feature.

Header:

What has actually been verified?

Create a verification matrix:

Check                              Status

Type checking                      ✓ Passed
Unit tests                         ✓ Passed
Existing integration tests         ✓ Passed
Cache invalidation                 ⚠ Missing
Webhook consistency                ⚠ Missing
Concurrent update behavior         ⚠ Missing


Use:

green check

amber warning

red failure

Never show everything as successful.

The product must demonstrate that AI can identify uncertainty.

25. Recommended tests

Below the matrix:

Recommended verification


Cards:

1. Cache invalidation after webhook

Update payment
      ↓
Trigger webhook
      ↓
Invalidate Redis
      ↓
Read payment
      ↓
Verify returned state


Button:

Copy test scenario

2. Concurrent updates

Send two payment updates concurrently
and verify cache consistency.


Button:

Generate test

26. Evidence tab

Create a searchable evidence explorer.

Filters:

All
Git history
Pull requests
Issues
Documentation
Code
Tests


Example:

Evidence

PR #218
Reduce payment DB load
GitHub PR
Strong relevance

Issue #391
Payment status latency
GitHub Issue
High relevance

PaymentService.ts
Cache implementation
Code
Direct evidence

WebhookHandler.ts
Payment update flow
Code
Related evidence


Add relevance/confidence indicators.

27. Files tab

Create a changed-files explorer.

Example:

Changed files

M  src/payment/PaymentService.ts
M  src/payment/WebhookHandler.ts
M  src/api/PaymentStatusController.ts
A  src/cache/RedisClient.ts
M  package.json


Click file → show diff.

Filters:

All
Added
Modified
Deleted


28. Right-side intelligence panel

On desktop, investigation pages can have an optional right-side panel.

Header:

Trace Intelligence

Example:

What should I look at first?

1. Cache invalidation
   High impact

2. WebhookHandler
   State mutation source

3. Missing integration tests
   Verification gap


Then:

Ask about this change

[ Why is this medium risk?      ]


The chat must be contextual to the current investigation.

Do NOT make it look like a generic chatbot.

It should answer questions using the current investigation data.

Suggested prompts:

Why is this medium risk?
What changed architecturally?
Show me the strongest evidence.
What would you test first?
What assumptions did this PR introduce?


29. Investigation history page

Route:

/investigations


Create a professional table.

Columns:

Repository
PR
Title
Risk
Confidence
Verification
Analyzed


Example:

payments-api
#482
Add Redis caching
Medium
82%
3 gaps
42 sec ago

checkout
#479
Retry payment requests
High
76%
5 gaps
2 hrs ago

auth-service
#477
JWT rotation
Low
94%
1 gap
Yesterday


Filters:

repository

risk

status

date

Search:

Search investigations...


30. Repository page

Route:

/repositories


Cards:

payments-api
main
142 investigations
7 high-risk changes

checkout-service
main
87 investigations
3 high-risk changes


Click repository → repository overview.

Show:

total investigations

risk distribution

recent PRs

common risk categories

verification gaps

Keep this secondary to the investigation workflow.

31. Repository detail

Route:

/repositories/:id


Header:

payments-api

github.com/acme/payments

main


Sections:

Recent investigations

Risk trends

Frequently affected services

Verification gaps


32. Settings

Route:

/settings


Sections:

GitHub

Connected
acme organization

[Manage connection]


AI analysis

Analysis depth
○ Fast
● Balanced
○ Deep


Notifications

High-risk PR detected
[ON]

Verification gaps
[ON]


Do not overbuild settings.

33. Global search

Keyboard shortcut:

⌘ K


or:

Ctrl K


Search:

PRs

repositories

investigations

files

Command palette style.

Example:

Search Trace

⌘K

Recent
  PR #482 — Add Redis caching
  payments-api
  Investigation #128

Search repositories...
Search investigations...


34. Important interactions

Implement these interactions properly.

Analyze PR

Input URL → loading pipeline → investigation result.

Investigation row

Click → investigation.

File

Click → diff drawer.

Evidence

Click → evidence drawer.

Risk

Click → detailed risk.

Architecture node

Click → component details.

Verification item

Click → explanation.

Search

Keyboard shortcut → command palette.

Tabs

Smooth tab transitions.

Share

Generate shareable investigation URL.

35. Demo data

The frontend must work perfectly even without backend connectivity.

Create realistic mock data around one primary demo repository:

acme/payments-api


Primary PR:

#482
Add Redis caching to payment status API


Use realistic:

filenames

diffs

commits

issues

evidence

architecture

risks

verification checks

Do NOT use fake Lorem Ipsum.

Do NOT use obviously generated nonsense.

The demo should feel like a real repository.

36. Primary demo scenario

The entire UI should optimize for this flow:

Landing
   ↓
Analyze PR
   ↓
Paste GitHub PR
   ↓
Analysis progress
   ↓
Investigation
   ↓
Overview
   ↓
What Changed
   ↓
Why
   ↓
Architecture
   ↓
Risk
   ↓
Verification
   ↓
Evidence


A reviewer should understand the product in under 60 seconds.

A hiring manager should be able to click through the entire experience in 2–3 minutes.

37. Empty states

Create polished empty states.

Example:

No investigations yet

Connect GitHub and analyze your first pull request.

[Analyze a PR]


Do not leave blank screens.

38. Error states

Create realistic errors.

Example:

We couldn't analyze this pull request.

The repository may be private or your GitHub
connection may have expired.

[Reconnect GitHub]
[Try again]


Another:

Analysis partially completed.

We could not retrieve historical issue data,
but code and PR analysis are available.

[View investigation]


39. Responsive behavior

Desktop is the primary target.

Still support:

laptop

tablet

mobile

On mobile:

sidebar becomes drawer

architecture graph becomes horizontally scrollable

right intelligence panel becomes bottom sheet

tables become cards

code viewer remains horizontally scrollable

Do not simply shrink the desktop layout.

40. Animation

Use subtle animations only.

Good:

analysis progress

tab transitions

evidence expansion

graph appearance

risk badge transitions

drawer opening

Bad:

excessive floating elements

flashy gradients

constant motion

animated backgrounds

unnecessary particle effects

This is a serious engineering product.

41. Accessibility

Implement:

keyboard navigation

visible focus states

semantic buttons

accessible dialogs

accessible tabs

sufficient color contrast

tooltips for unfamiliar icons

Do not rely only on color to communicate risk.

Example:

⚠ MEDIUM


rather than only an amber circle.

42. API abstraction

Create a service layer.

Example conceptual interface:

analyzePullRequest(url: string)

getInvestigation(id: string)

getInvestigationSummary(id: string)

getChanges(id: string)

getArchitecture(id: string)

getRisks(id: string)

getVerification(id: string)

getEvidence(id: string)

getChangedFiles(id: string)

askInvestigationQuestion(
  id: string,
  question: string
)


For now these functions can return mock data.

But structure them as if the backend already exists.

Do NOT couple components directly to mock JSON.

43. Backend API contract

Design the frontend around these future FastAPI endpoints:

POST   /api/v1/investigations
GET    /api/v1/investigations/:id
GET    /api/v1/investigations/:id/changes
GET    /api/v1/investigations/:id/architecture
GET    /api/v1/investigations/:id/risks
GET    /api/v1/investigations/:id/verification
GET    /api/v1/investigations/:id/evidence
GET    /api/v1/investigations/:id/files
POST   /api/v1/investigations/:id/questions
GET    /api/v1/repositories
GET    /api/v1/investigations


For analysis progress:

GET /api/v1/investigations/:id/events


using Server-Sent Events.

44. Type definitions

Create TypeScript types for:

Repository
PullRequest
Investigation
Change
ArchitectureNode
ArchitectureEdge
Risk
Evidence
VerificationCheck
ChangedFile
AnalysisEvent


Do not use any throughout the application.

45. Data model example

The main investigation object should conceptually look like:

{
  id: "inv_128",
  repository: "acme/payments-api",
  pullRequest: {
    number: 482,
    title: "Add Redis caching to payment status API",
    author: "alex"
  },
  risk: {
    level: "medium",
    confidence: 0.82
  },
  summary: "...",
  filesChanged: 8,
  servicesAffected: 3,
  risks: [...],
  evidence: [...],
  verification: [...],
  architecture: {...}
}


46. Product language

Use precise engineering language.

Prefer:

"Verification gap"

instead of:

"AI thinks this might be bad."

Prefer:

"Evidence strength: Strong"

instead of:

"AI confidence: 94%!!!"

Prefer:

"Potential stale-state risk"

instead of:

"Danger!"

The product should feel trustworthy.

47. AI trust UX

This is extremely important.

Never present AI conclusions as unquestionable facts.

Every major AI conclusion should have:

Conclusion
Confidence
Evidence
Unknowns


Example:

Likely architectural impact

MEDIUM CONFIDENCE

The change introduces Redis as a new stateful dependency
between PaymentService and PostgreSQL.

Evidence
• PaymentService.ts
• RedisClient.ts
• PR #482

Unknown
• Production cache hit ratio
• Existing Redis failure behavior


This should become a signature part of the Trace UX.

48. Don't overbuild

This is a 3-day hiring assignment.

Do NOT implement:

real authentication

billing

teams

RBAC

complex permissions

Kubernetes

microservices

real-time collaboration

full IDE

complete code indexing

dozens of integrations

elaborate admin panel

The product should be deep, not wide.

One excellent investigation workflow is more valuable than 30 shallow features.

49. Most important screen priority

If time becomes limited, prioritize in this exact order:

P0

Analyze PR

Analysis progress

Investigation overview

What Changed

Why / evidence

Architecture

Risk

Verification

P1

Files/diff viewer

Evidence explorer

Investigation history

P2

Repository management

Settings

Advanced search

If necessary, completely remove P2 features rather than compromising P0.

50. Final quality bar

Before considering the frontend complete, verify:

no broken routes

no console errors

no placeholder text

no Lorem Ipsum

no generic stock imagery

no fake buttons that do nothing

all major interactions work

loading states work

empty states work

error states work

desktop layout is polished

mobile layout doesn't break

mock API layer is clean

TypeScript types are consistent

components are reusable

spacing is consistent

typography is consistent

code/diff viewer looks realistic

investigation page feels like the core product

demo can be completed without backend

51. Final design principle

The entire application should communicate one idea:

Trace doesn't tell engineers what to think. It gives them the evidence they need to make a better decision.

Build the UI around that principle.

Do not turn Trace into another chatbot.

The investigation workspace is the product.

The AI is the engine underneath it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c7620c3a-dddd-4569-833b-6a4aecb76f53).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
