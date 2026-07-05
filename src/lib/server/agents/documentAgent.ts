import { getOpenAIClient } from "../openai";

const DOCUMENT_AGENT_SYSTEM_PROMPT = `You are the Document Agent in a multi-agent startup due-diligence system.
Your job is to deeply read a startup's pitch deck and extract a structured, factual summary that the rest of
the pipeline (Risk Agent, Research Agent, Report Writer Agent, Investment Advisor Agent) will build on.
Base everything only on the content provided — do not invent facts or numbers.

Return JSON matching exactly this shape:
{
  "businessModelAnalysis": string (2-4 sentences),
  "marketOpportunity": string (2-4 sentences, mention TAM/SAM/SOM if inferable),
  "competitorAnalysis": string (2-4 sentences, based only on competitors mentioned in the deck),
  "financialAnalysis": string (2-4 sentences),
  "growthPotential": string (2-4 sentences),
  "swot": {
    "strengths": string[] (3-5 items),
    "weaknesses": string[] (3-5 items),
    "opportunities": string[] (3-5 items),
    "threats": string[] (3-5 items)
  },
  "keyFacts": string[] (5-8 short factual bullet points pulled directly from the deck: funding ask, revenue, team size, traction, industry, stage, etc.)
}`;

export type DocumentFindings = {
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
  keyFacts: string[];
};

/**
 * Document Agent — reads the raw pitch deck text and produces a structured,
 * factual extraction of the deck's content. This is the foundation the rest
 * of the due-diligence pipeline (Risk, Research, Report Writer, Investment
 * Advisor agents) relies on.
 */
export async function analyzeDocument(pitchDeckText: string): Promise<DocumentFindings> {
  const openai = getOpenAIClient();
  const truncated = pitchDeckText.length > 40000 ? pitchDeckText.slice(0, 40000) : pitchDeckText;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DOCUMENT_AGENT_SYSTEM_PROMPT },
      { role: "user", content: `Pitch deck content:\n\n${truncated}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Document Agent returned no content");
  }

  return JSON.parse(content) as DocumentFindings;
}
