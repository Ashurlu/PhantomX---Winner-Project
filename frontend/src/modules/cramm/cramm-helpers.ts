import type { CrammDetail, CrammTechniqueReport } from "@/lib/types";

export function buildCrammTechniqueReport(detail: CrammDetail): CrammTechniqueReport {
  return {
    generatedAt: new Date().toISOString(),
    reportType: "cramm_technique_risk",
    executiveSummary: {
      techniqueId: detail.techniqueId,
      mitreId: detail.mitreId,
      title: detail.title,
      riskScore: detail.riskScore,
      riskScoreLabel: detail.riskScoreLabel,
      severity: detail.severityLabel,
      annualLoss: detail.annualLoss,
      enterpriseAle: detail.assessment.enterpriseAle,
      criticalityPct: detail.assessment.criticalityPct,
      resolutionWindow: detail.resolutionWindow,
    },
    detail,
    recommendedControls: detail.controls,
  };
}

export function formatReportDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
