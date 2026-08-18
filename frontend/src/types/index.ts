export type RiskLevel = "low" | "medium" | "high" | "critical";
export type VerificationStatus = "passed" | "failed" | "missing" | "partial";
export type EvidenceKind = "pull_request" | "issue" | "commit" | "code" | "docs" | "test";
export type EvidenceStrength = "direct" | "strong" | "moderate" | "weak";
export type ChangeKind = "added" | "modified" | "removed";
export type FileStatus = "added" | "modified" | "deleted";
export type BlastLevel = "direct" | "indirect" | "potential";
export type InvestigationStatus = "verified" | "review" | "analyzing" | "failed" | "partial";

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  language: string;
  investigations: number;
  highRiskChanges: number;
  verificationGaps: number;
  riskDistribution: Record<RiskLevel, number>;
  frequentServices: { name: string; touches: number }[];
  commonRiskCategories: { name: string; count: number }[];
  lastAnalyzedAt: string;
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  openedAt: string;
  headBranch: string;
  baseBranch: string;
  url: string;
  additions: number;
  deletions: number;
}

export interface DiffLine {
  type: "context" | "add" | "del";
  oldLine: number | null;
  newLine: number | null;
  content: string;
}

export interface ChangedFile {
  path: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  language: string;
  summary: string;
  hunks: { header: string; lines: DiffLine[] }[];
}

export interface Change {
  id: string;
  kind: ChangeKind;
  title: string;
  detail: string;
  components: string[];
  files: string[];
  evidenceIds: string[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: "service" | "datastore" | "api" | "worker" | "external";
  changed: boolean;
  column: number;
  row: number;
  references: number;
  changedFunctions: number;
  incoming: number;
  outgoing: number;
  note: string;
}

export interface ArchitectureEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind: "read" | "write" | "invalidate" | "call";
  added: boolean;
}

export interface BlastRadiusEntry {
  component: string;
  level: BlastLevel;
  reason: string;
}

export interface Architecture {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  blastRadius: BlastRadiusEntry[];
  conclusion: AiConclusion;
}

export interface AiConclusion {
  title: string;
  confidence: number;
  statement: string;
  evidenceIds: string[];
  unknowns: string[];
}

export interface Risk {
  id: string;
  title: string;
  level: RiskLevel;
  category: string;
  description: string;
  affectedComponents: string[];
  evidenceIds: string[];
  locations: { file: string; line: number }[];
  mitigation: string;
  confidence: number;
}

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  ref: string;
  title: string;
  strength: EvidenceStrength;
  source: string;
  author: string;
  date: string;
  excerpt: string;
  file?: string;
  lines?: [number, number];
  url?: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  status: VerificationStatus;
  detail: string;
  source: string;
  durationMs?: number;
}

export interface RecommendedTest {
  id: string;
  title: string;
  rationale: string;
  steps: string[];
  scenario: string;
}

export interface Verification {
  checks: VerificationCheck[];
  recommended: RecommendedTest[];
  conclusion: AiConclusion;
}

export interface ReasoningStep {
  id: string;
  label: string;
  ref: string;
  detail: string;
  date: string;
  evidenceId?: string;
}

export interface WhyAnalysis {
  question: string;
  chain: ReasoningStep[];
  interpretation: string;
  confidence: number;
  evidenceStrength: EvidenceStrength;
  unknowns: string[];
}

export interface InvestigationSummary {
  id: string;
  repository: string;
  repositoryId: string;
  pullRequest: PullRequest;
  risk: { level: RiskLevel; confidence: number; primaryConcern: string };
  status: InvestigationStatus;
  filesChanged: number;
  servicesAffected: number;
  newDependencies: number;
  verificationChecks: number;
  verificationGaps: number;
  riskCount: number;
  analysisSeconds: number;
  analyzedAt: string;
}

export interface Investigation extends InvestigationSummary {
  headline: string;
  executiveSummary: string[];
  changes: Change[];
  why: WhyAnalysis;
  architecture: Architecture;
  risks: Risk[];
  evidence: Evidence[];
  verification: Verification;
  files: ChangedFile[];
  priorities: { title: string; note: string; tab: string }[];
}

export interface AnalysisEvent {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export interface OverviewMetrics {
  investigations: { value: number; delta: string };
  highRisk: { value: number; delta: string };
  verificationGaps: { value: number; delta: string };
  avgAnalysis: { value: string; delta: string };
  riskDistribution: Record<RiskLevel, number>;
}

export interface AnswerCitation {
  evidenceId: string;
  label: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  citations: AnswerCitation[];
  unknowns: string[];
}
