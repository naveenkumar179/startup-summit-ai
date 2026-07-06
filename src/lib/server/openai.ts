import OpenAI from "openai";

let client: OpenAI | undefined;

// Uses Groq's OpenAI-compatible API (https://api.groq.com/openai/v1).
export function getOpenAIClient(): OpenAI {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Please add it to your secrets.");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}
