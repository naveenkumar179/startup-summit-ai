import { getOpenAIClient } from "./openai";
import type { DetailedAnalysis, ImprovementSuggestion, PitchDeckAnalysis } from "./db/schema";

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

export async function extractPdfPages(buffer: Buffer): Promise<string[]> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = result.pages ?? [];
    if (pages.length > 0) {
      return pages.map((p) => p.text.trim());
    }
    return [result.text.trim()];
  } catch {
    return [];
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

const DETAILED_ANALYSIS_SYSTEM_PROMPT = `You are a senior venture capital due-diligence analyst.
Analyze the provided pitch deck content and return a comprehensive, structured JSON assessment
that an investor could use to evaluate the investment opportunity. Be honest, specific, and base
everything only on the content provided — do not invent facts.

Return JSON matching exactly this shape:
{
  "investmentReadinessScore": number (0-100),
  "recommendation": string (2-3 sentence investment recommendation),
  "swot": {
    "strengths": string[] (3-5 items),
    "weaknesses": string[] (3-5 items),
    "opportunities": string[] (3-5 items),
    "threats": string[] (3-5 items)
  },
  "businessModelAnalysis": string (2-4 sentences),
  "marketOpportunity": string (2-4 sentences, mention TAM/SAM/SOM if inferable),
  "competitorAnalysis": string (2-4 sentences),
  "riskAnalysis": string[] (3-5 concise risk bullet points),
  "financialAnalysis": string (2-4 sentences),
  "growthPotential": string (2-4 sentences)
}`;

export async function generateDetailedAnalysis(text: string): Promise<DetailedAnalysis> {
  const openai = getOpenAIClient();
  const truncated = text.length > 40000 ? text.slice(0, 40000) : text;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DETAILED_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: `Pitch deck content:\n\n${truncated}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis content returned from AI");
  }

  return JSON.parse(content) as DetailedAnalysis;
}

const IMPROVEMENT_SYSTEM_PROMPT = `You are an expert pitch deck coach who helps startup founders improve their pitch decks
before sending them to investors. Analyze the provided pitch deck content and identify concrete gaps,
weaknesses, and opportunities to strengthen the deck (for example: missing TAM/market sizing, missing
revenue model, weak traction evidence, weak team section, missing go-to-market strategy, missing
financial projections, missing competitor slide, or ways to apply investor-pitching best practices).
For each item found, classify it and provide a specific suggestion and a short concrete example of how
to address it. Only flag issues that are actually present in the content — do not invent extra gaps if
the deck is strong, but always include at least one "best_practice" item with general advice tailored to
this specific deck's stage/industry even if the deck already covers the basics.

Return JSON matching exactly this shape:
{
  "suggestions": [
    {
      "area": string (e.g. "Market Sizing"),
      "category": "missing_section" | "weak_content" | "best_practice",
      "priority": "high" | "medium" | "low",
      "issue": string,
      "suggestion": string,
      "example": string
    }
  ]
}
Return between 4 and 9 suggestions, ordered by priority (high first). Use "missing_section" when a
standard section is entirely absent, "weak_content" when a section exists but needs strengthening, and
"best_practice" for general tips that would elevate an already-present section.`;

export async function generateImprovementSuggestions(text: string): Promise<ImprovementSuggestion[]> {
  const openai = getOpenAIClient();
  const truncated = text.length > 40000 ? text.slice(0, 40000) : text;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: IMPROVEMENT_SYSTEM_PROMPT },
      { role: "user", content: `Pitch deck content:\n\n${truncated}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No suggestions content returned from AI");
  }

  const parsed = JSON.parse(content) as { suggestions: ImprovementSuggestion[] };
  return parsed.suggestions;
}

const CHAT_SYSTEM_PROMPT = `You are an AI assistant helping an investor evaluate a startup.
Answer the investor's question using ONLY the pitch deck content provided below as your source of truth.
The pitch deck is provided as a series of pages, each tagged like "[[PAGE 3]]". If the pitch deck does
not contain enough information to answer, say so clearly and suggest the investor ask the founder
directly — do not make up facts or numbers that are not in the content. Keep answers concise
(2-5 sentences) and specific.

After answering, also return 2-3 short, specific follow-up questions the investor could naturally ask
next about this startup, based on what has NOT yet been discussed in the conversation.

Return JSON matching exactly this shape:
{
  "answer": string,
  "sourcePages": number[] (the page numbers from the pitch deck that support your answer; empty array if none),
  "suggestedQuestions": string[] (2-3 short follow-up questions)
}`;

export type ChatAnswer = {
  answer: string;
  sourcePages: number[];
  suggestedQuestions: string[];
};

export async function answerPitchDeckQuestion(
  pitchDeckText: string,
  pageTexts: string[] | null | undefined,
  history: { role: "user" | "assistant"; content: string }[],
  question: string,
): Promise<ChatAnswer> {
  const openai = getOpenAIClient();

  let content: string;
  if (pageTexts && pageTexts.length > 0) {
    const tagged = pageTexts.map((text, i) => `[[PAGE ${i + 1}]]\n${text}`).join("\n\n");
    content = tagged.length > 40000 ? tagged.slice(0, 40000) : tagged;
  } else {
    content = pitchDeckText.length > 40000 ? pitchDeckText.slice(0, 40000) : pitchDeckText;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `${CHAT_SYSTEM_PROMPT}\n\nPitch deck content:\n\n${content}` },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    return { answer: "I couldn't generate a response. Please try again.", sourcePages: [], suggestedQuestions: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ChatAnswer>;
    return {
      answer: parsed.answer ?? "I couldn't generate a response. Please try again.",
      sourcePages: Array.isArray(parsed.sourcePages) ? parsed.sourcePages : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [],
    };
  } catch {
    return { answer: raw, sourcePages: [], suggestedQuestions: [] };
  }
}
