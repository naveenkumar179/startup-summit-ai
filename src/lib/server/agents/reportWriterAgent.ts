import { getOpenAIClient } from "../openai";
import type { DocumentFindings } from "./documentAgent";
import type { RiskFindings } from "./riskAgent";

const REPORT_WRITER_SYSTEM_PROMPT = `You are the Report Writer Agent in a multi-agent startup due-diligence
system. You receive structured findings from a Document Agent (deck analysis), a Risk Agent (risk
assessment), and optionally a Research Agent (current market/competitor context from the web). Your job is
to weave these into a single, cohesive, investor-ready due-diligence narrative. Do not contradict the
source findings; refine, connect, and clarify them. If market research context is provided, blend it
naturally into the market opportunity and competitor analysis sections without fabricating anything beyond
what's given.

Return JSON matching exactly this shape:
{
  "businessModelAnalysis": string (2-4 sentences),
  "marketOpportunity": string (2-4 sentences),
  "competitorAnalysis": string (2-4 sentences),
  "financialAnalysis": string (2-4 sentences),
  "growthPotential": string (2-4 sentences),
  "swot": {
    "strengths": string[] (3-5 items),
    "weaknesses": string[] (3-5 items),
    "opportunities": string[] (3-5 items),
    "threats": string[] (3-5 items)
  }
}`;

export type ReportSections = {
  businessModelAnalysis: string;
  marketOpportunity: string;
  competitorAnalysis: string;
  financialAnalysis: string;
  growthPotential: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
};

/**
 * Report Writer Agent — synthesizes the outputs of the Document, Risk, and
 * (optionally) Research agents into the final cohesive due-diligence report
 * sections that are shown to the investor.
 */
export async function writeDueDiligenceReport(
  documentFindings: DocumentFindings,
  riskFindings: RiskFindings,
  marketContext: string,
): Promise<ReportSections> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: REPORT_WRITER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Document Agent findings:\n${JSON.stringify(documentFindings, null, 2)}\n\nRisk Agent findings:\n${JSON.stringify(
          riskFindings,
          null,
          2,
        )}\n\n${
          marketContext
            ? `Research Agent market context:\n${marketContext}`
            : "No additional web research was needed for this deck."
        }`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Report Writer Agent returned no content");
  }

  return JSON.parse(content) as ReportSections;
}
