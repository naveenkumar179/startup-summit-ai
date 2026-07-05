import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks, startups } from "@/lib/server/db/schema";
import { generateImprovementSuggestions } from "@/lib/server/pitch-deck";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/startups/$id/improve")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup || startup.founderId !== user.id) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }
          if (!startup.pitchDeckId) {
            return jsonResponse({ message: "Upload a pitch deck first" }, 400);
          }

          const [deck] = await db.select().from(pitchDecks).where(eq(pitchDecks.id, startup.pitchDeckId));
          if (!deck?.extractedText) {
            return jsonResponse({ message: "Pitch deck has no readable content" }, 400);
          }

          const improvementSuggestions = await generateImprovementSuggestions(deck.extractedText);

          const [updated] = await db
            .update(startups)
            .set({ improvementSuggestions, updatedAt: new Date() })
            .where(eq(startups.id, startup.id))
            .returning();

          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Generate improvement suggestions error:", error);
          return jsonResponse({ message: "Failed to generate suggestions" }, 500);
        }
      },
    },
  },
});
