import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks, startups } from "@/lib/server/db/schema";
import { answerPitchDeckQuestion } from "@/lib/server/pitch-deck";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/startups/$id/chat")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }
          if (startup.founderId !== user.id && startup.status !== "published") {
            return jsonResponse({ message: "Startup not found" }, 404);
          }
          if (!startup.pitchDeckId) {
            return jsonResponse({ message: "This startup has no pitch deck uploaded yet" }, 400);
          }

          const [deck] = await db
            .select()
            .from(pitchDecks)
            .where(eq(pitchDecks.id, startup.pitchDeckId));
          if (!deck?.extractedText) {
            return jsonResponse({ message: "Pitch deck has no readable content" }, 400);
          }

          const body = (await request.json()) as {
            question?: string;
            history?: { role: "user" | "assistant"; content: string }[];
          };
          const question = body.question?.trim();
          if (!question) {
            return jsonResponse({ message: "Question is required" }, 400);
          }

          const result = await answerPitchDeckQuestion(
            deck.extractedText,
            deck.pageTexts,
            body.history ?? [],
            question,
            startup.name,
          );
          return jsonResponse(result);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Pitch deck chat error:", error);
          return jsonResponse({ message: "Failed to get an answer" }, 500);
        }
      },
    },
  },
});
