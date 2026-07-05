import type { DetailedAnalysis } from "../db/schema";
import { analyzeDocument } from "./documentAgent";
import { assessRisks } from "./riskAgent";
import { researchMarketContext } from "./researchAgent";
import { writeDueDiligenceReport } from "./reportWriterAgent";
import { scoreInvestment } from "./investmentAdvisorAgent";

function needsMarketResearch(documentFindings: {
  marketOpportunity: string;
  competitorAnalysis: string;
}): boolean {
  const combined =
    `${documentFindings.marketOpportunity} ${documentFindings.competitorAnalysis}`.toLowerCase();
  return (
    combined.length < 120 ||
    combined.includes("not mentioned") ||
    combined.includes("not specified") ||
    combined.includes("unclear") ||
    combined.includes("no competitor") ||
    combined.includes("not provided")
  );
}

export const AGENT_NAMES = [
  "Document Agent",
  "Risk Agent",
  "Research Agent",
  "Report Writer Agent",
  "Investment Advisor Agent",
  "Supervisor Agent",
] as const;

/**
 * Supervisor Agent — orchestrates the full due-diligence multi-agent
 * pipeline, mirroring the spec's LangGraph supervisor pattern:
 *
 *   1. Document Agent  — structures the raw pitch deck into factual findings
 *   2. Risk Agent       — assesses risk from those findings + the raw deck
 *   3. Research Agent   — (conditionally) fills market/competitor gaps via web search
 *   4. Report Writer Agent — synthesizes everything into one cohesive report
 *   5. Investment Advisor Agent — makes the final score + recommendation call
 *
 * The Supervisor itself decides step 3 dynamically based on how complete the
 * Document Agent's findings are, instead of always paying for a web search.
 */
export async function runDueDiligencePipeline(
  pitchDeckText: string,
  startupName: string,
  industry: string,
): Promise<DetailedAnalysis> {
  const documentFindings = await analyzeDocument(pitchDeckText);

  const riskFindings = await assessRisks(pitchDeckText, documentFindings);

  let marketContext = "";
  if (needsMarketResearch(documentFindings)) {
    const research = await researchMarketContext(startupName, industry);
    marketContext = research.marketContext;
  }

  const reportSections = await writeDueDiligenceReport(
    documentFindings,
    riskFindings,
    marketContext,
  );

  const advice = await scoreInvestment(documentFindings, reportSections, riskFindings);

  return {
    investmentReadinessScore: advice.investmentReadinessScore,
    recommendation: advice.recommendation,
    swot: reportSections.swot,
    businessModelAnalysis: reportSections.businessModelAnalysis,
    marketOpportunity: reportSections.marketOpportunity,
    competitorAnalysis: reportSections.competitorAnalysis,
    riskAnalysis: riskFindings.riskAnalysis,
    financialAnalysis: reportSections.financialAnalysis,
    growthPotential: reportSections.growthPotential,
  };
}
