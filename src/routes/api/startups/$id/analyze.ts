import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks, startups } from "@/lib/server/db/schema";
import { runDueDiligencePipeline } from "@/lib/server/agents/supervisorAgent";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/startups/$id/analyze")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          const user = await requireUser();
          const [startup] = await db.select().from(startups).where(eq(startups.id, params.id));
          if (!startup) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }
          if (startup.founderId !== user.id && user.role !== "investor") {
            return jsonResponse({ message: "Not authorized" }, 403);
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

          const detailedAnalysis = await runDueDiligencePipeline(
            deck.extractedText,
            startup.name,
            startup.industry,
          );

          const [updated] = await db
            .update(startups)
            .set({ detailedAnalysis, updatedAt: new Date() })
            .where(eq(startups.id, startup.id))
            .returning();

          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Generate analysis error:", error);
          return jsonResponse({ message: "Failed to generate AI analysis" }, 500);
        }
      },
    },
  },
});
