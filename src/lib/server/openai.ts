import OpenAI from "openai";
import { wrapOpenAI } from "langsmith/wrappers";

let client: OpenAI | undefined;

// Uses Groq's OpenAI-compatible API (https://api.groq.com/openai/v1).
// All calls are automatically traced in LangSmith when LANGSMITH_TRACING=true.
export function getOpenAIClient(): OpenAI {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Please add it to your secrets.");
  }
  if (!client) {
    const raw = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    client = wrapOpenAI(raw);
  }
  return client;
}
