import { getOpenAIClient } from "../openai";
import type { DocumentFindings } from "./documentAgent";
import type { ReportSections } from "./reportWriterAgent";
import type { RiskFindings } from "./riskAgent";

const INVESTMENT_ADVISOR_SYSTEM_PROMPT = `You are the Investment Advisor Agent in a multi-agent startup
due-diligence system. You receive the compiled due-diligence report and the risk assessment. Your job is to
make the final call: an investment readiness score and a clear, actionable recommendation for the investor.
Weigh the risks appropriately — a strong opportunity with severe, unmitigated risks should not receive a
very high score.

Return JSON matching exactly this shape:
{
  "investmentReadinessScore": number (0-100),
  "recommendation": string (2-3 sentence investment recommendation, referencing both strengths and key risks)
}`;

export type InvestmentAdvice = {
  investmentReadinessScore: number;
  recommendation: string;
};

/**
 * Investment Advisor Agent — the final step of the due-diligence pipeline.
 * Reviews the Report Writer Agent's narrative alongside the Risk Agent's
 * findings and produces the investment readiness score + recommendation
 * shown at the top of the report.
 */
export async function scoreInvestment(
  documentFindings: DocumentFindings,
  reportSections: ReportSections,
  riskFindings: RiskFindings,
): Promise<InvestmentAdvice> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: INVESTMENT_ADVISOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Key facts:\n${documentFindings.keyFacts.join("\n")}\n\nCompiled report:\n${JSON.stringify(
          reportSections,
          null,
          2,
        )}\n\nRisk assessment (level: ${riskFindings.riskLevel}):\n${riskFindings.riskAnalysis.join("\n")}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Investment Advisor Agent returned no content");
  }

  return JSON.parse(content) as InvestmentAdvice;
}
