import { getOpenAIClient } from "../openai";
import type { DocumentFindings } from "./documentAgent";

const RISK_AGENT_SYSTEM_PROMPT = `You are the Risk Agent in a multi-agent startup due-diligence system.
Given a startup's pitch deck content and a prior structural summary from the Document Agent, identify the
concrete risks an investor should be aware of before investing. Consider market risk, execution risk,
competitive risk, financial/runway risk, team risk, and regulatory risk where relevant. Base everything
only on the content and summary provided — do not invent facts.

Return JSON matching exactly this shape:
{
  "riskAnalysis": string[] (3-6 concise, specific risk bullet points, ordered by severity, highest first),
  "riskLevel": "low" | "medium" | "high"
}`;

export type RiskFindings = {
  riskAnalysis: string[];
  riskLevel: "low" | "medium" | "high";
};

/**
 * Risk Agent — takes the Document Agent's structured findings plus the raw
 * deck text and produces a dedicated risk assessment. Kept as a separate
 * agent (rather than folded into one big prompt) so risk analysis gets
 * focused attention and can be reasoned about independently.
 */
export async function assessRisks(
  pitchDeckText: string,
  documentFindings: DocumentFindings,
): Promise<RiskFindings> {
  const openai = getOpenAIClient();
  const truncated = pitchDeckText.length > 40000 ? pitchDeckText.slice(0, 40000) : pitchDeckText;

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: RISK_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Pitch deck content:\n\n${truncated}\n\nDocument Agent summary:\n${JSON.stringify(
          documentFindings,
          null,
          2,
        )}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Risk Agent returned no content");
  }

  return JSON.parse(content) as RiskFindings;
}
