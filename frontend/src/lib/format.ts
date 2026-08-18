import type { BlastLevel, EvidenceKind, EvidenceStrength, FileStatus, RiskLevel } from "@/types";

export const riskLabel: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const riskTextClass: Record<RiskLevel, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
  critical: "text-risk-critical",
};

export const riskBgClass: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export const riskSoftClass: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low border-risk-low/30",
  medium: "bg-risk-medium-soft text-risk-medium border-risk-medium/30",
  high: "bg-risk-high-soft text-risk-high border-risk-high/30",
  critical: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
};

export const blastLabel: Record<BlastLevel, string> = {
  direct: "Directly affected",
  indirect: "Indirectly affected",
  potential: "Potentially affected",
};

export const evidenceKindLabel: Record<EvidenceKind, string> = {
  pull_request: "Pull request",
  issue: "Issue",
  commit: "Commit",
  code: "Code",
  docs: "Documentation",
  test: "Test",
};

export const strengthLabel: Record<EvidenceStrength, string> = {
  direct: "Direct evidence",
  strong: "Strong relevance",
  moderate: "Moderate relevance",
  weak: "Weak relevance",
};

export const fileStatusLabel: Record<FileStatus, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
};

export const pct = (value: number) => `${Math.round(value * 100)}%`;

export function confidenceLabel(value: number) {
  if (value >= 0.85) return "High confidence";
  if (value >= 0.65) return "Medium confidence";
  return "Low confidence";
}
