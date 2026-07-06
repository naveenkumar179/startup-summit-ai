import { getOpenAIClient } from "../openai";

export type ChatWebSearchAnswer = {
  answer: string;
  suggestedQuestions: string[];
};

const RESEARCH_AGENT_CHAT_SYSTEM_PROMPT = `You are the Research Agent in a multi-agent startup due-diligence
system, currently helping an investor chat about a specific startup. The investor asked a question that
requires up-to-date, real-world information (e.g. current competitors, latest funding news, industry
trends, or current market conditions) that cannot be answered from the pitch deck alone. Use the web search
tool to find current, relevant information, and combine it with the pitch deck content below where
relevant. Cite what you found from the web in plain language (e.g. "According to recent reports..."). Keep
the answer concise (2-5 sentences) and specific. Do not fabricate facts.

After answering, think of 2-3 short, specific follow-up questions the investor could naturally ask next.

Respond with ONLY a single JSON object (no markdown, no code fences) matching exactly this shape:
{
  "answer": string,
  "suggestedQuestions": string[] (2-3 short follow-up questions)
}`;

/**
 * Research Agent (chat mode) — used by the AI Chat feature when a question
 * needs current, real-world information the pitch deck can't provide
 * (competitors, news, market trends). Uses OpenAI's web search tool.
 * Returns null on failure so the caller can gracefully fall back to a
 * pitch-deck-only answer.
 */
export async function answerQuestionWithWebSearch(
  content: string,
  history: { role: "user" | "assistant"; content: string }[],
  question: string,
  startupName?: string,
): Promise<ChatWebSearchAnswer | null> {
  const openai = getOpenAIClient();

  const historyText = history
    .map((h) => `${h.role === "user" ? "Investor" : "Assistant"}: ${h.content}`)
    .join("\n");

  const input = `${RESEARCH_AGENT_CHAT_SYSTEM_PROMPT}

Startup: ${startupName ?? "the startup"}

Pitch deck content:

${content}

${historyText ? `Conversation so far:\n${historyText}\n` : ""}Investor's question: ${question}`;

  try {
    const response = await openai.responses.create({
      model: "llama-3.3-70b-versatile",
      tools: [{ type: "web_search_preview" }],
      input,
    });

    const raw = response.output_text?.trim();
    if (!raw) return null;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<ChatWebSearchAnswer>;
        return {
          answer: parsed.answer ?? raw,
          suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
            ? parsed.suggestedQuestions
            : [],
        };
      } catch {
        return { answer: raw, suggestedQuestions: [] };
      }
    }
    return { answer: raw, suggestedQuestions: [] };
  } catch (error) {
    console.error("Research Agent (chat) web search failed:", error);
    return null;
  }
}

export type MarketResearchFindings = {
  marketContext: string;
  usedWebSearch: boolean;
};

const MARKET_RESEARCH_PROMPT = `You are the Research Agent in a multi-agent startup due-diligence system.
The Document Agent found the pitch deck was thin on market sizing or competitor detail. Use the web search
tool to find brief, current, factual context about this startup's industry and any well-known competitors
in that space. Keep it short (3-5 sentences), factual, and directly useful for a due-diligence report. Do
not speculate about the specific startup itself — only provide general market/industry/competitor context.`;

/**
 * Research Agent (due-diligence mode) — invoked by the Supervisor Agent when
 * the pitch deck lacks sufficient market/competitor detail. Fetches brief,
 * current web context to fill the gap. Fails soft (returns empty context)
 * so the rest of the pipeline can continue without it.
 */
export async function researchMarketContext(
  startupName: string,
  industry: string,
): Promise<MarketResearchFindings> {
  const openai = getOpenAIClient();
  try {
    const response = await openai.responses.create({
      model: "llama-3.3-70b-versatile",
      tools: [{ type: "web_search_preview" }],
      input: `${MARKET_RESEARCH_PROMPT}\n\nStartup: ${startupName}\nIndustry: ${industry}`,
    });
    const text = response.output_text?.trim();
    if (!text) return { marketContext: "", usedWebSearch: false };
    return { marketContext: text, usedWebSearch: true };
  } catch (error) {
    console.error("Research Agent (due diligence) failed, continuing without it:", error);
    return { marketContext: "", usedWebSearch: false };
  }
}
