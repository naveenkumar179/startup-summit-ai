import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { pitchDecks } from "@/lib/server/db/schema";

export const Route = createFileRoute("/api/pitch-deck/list")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();

          const decks = await db
            .select()
            .from(pitchDecks)
            .where(eq(pitchDecks.userId, user.id))
            .orderBy(desc(pitchDecks.createdAt));

          return new Response(JSON.stringify(decks), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List pitch decks error:", error);
          return new Response(JSON.stringify({ message: "Failed to fetch pitch decks" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
