import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { watchlist } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/watchlist/$id")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const user = await requireUser();
          await db
            .delete(watchlist)
            .where(and(eq(watchlist.investorId, user.id), eq(watchlist.startupId, params.id)));
          return jsonResponse({ message: "ok" });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Remove from watchlist error:", error);
          return jsonResponse({ message: "Failed to remove startup" }, 500);
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const body = (await request.json()) as { notes?: string };
          const [updated] = await db
            .update(watchlist)
            .set({ notes: body.notes?.trim() || null })
            .where(and(eq(watchlist.investorId, user.id), eq(watchlist.startupId, params.id)))
            .returning();
          if (!updated) {
            return jsonResponse({ message: "Not found" }, 404);
          }
          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Update watchlist notes error:", error);
          return jsonResponse({ message: "Failed to update notes" }, 500);
        }
      },
    },
  },
});
