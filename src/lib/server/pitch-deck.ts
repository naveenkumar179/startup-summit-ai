import { getOpenAIClient } from "./openai";
import type { PitchDeckAnalysis } from "./db/schema";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

const SYSTEM_PROMPT = `You are an expert venture capital analyst who reviews startup pitch decks.
Analyze the provided pitch deck text and return a structured JSON assessment.
Be honest, constructive, and specific. Base your feedback only on the content provided.

Return JSON matching exactly this shape:
{
  "overallScore": number (0-100),
  "summary": string (2-3 sentence executive summary),
  "strengths": string[] (3-5 concise bullet points),
  "weaknesses": string[] (3-5 concise bullet points),
  "categories": [
    { "name": "Problem & Solution", "score": number (0-100), "feedback": string },
    { "name": "Market Opportunity", "score": number (0-100), "feedback": string },
    { "name": "Business Model", "score": number (0-100), "feedback": string },
    { "name": "Traction", "score": number (0-100), "feedback": string },
    { "name": "Team", "score": number (0-100), "feedback": string },
    { "name": "Financials & Ask", "score": number (0-100), "feedback": string }
  ],
  "suggestedInvestorTypes": string[] (2-4 investor types/stages that would be the best fit, e.g. "Pre-seed generalist", "B2B SaaS seed fund")
}`;

export async function analyzePitchDeckText(text: string): Promise<PitchDeckAnalysis> {
  const openai = getOpenAIClient();

  const truncated = text.length > 40000 ? text.slice(0, 40000) : text;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Pitch deck content:\n\n${truncated}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis content returned from AI");
  }

  const parsed = JSON.parse(content) as PitchDeckAnalysis;
  return parsed;
}
