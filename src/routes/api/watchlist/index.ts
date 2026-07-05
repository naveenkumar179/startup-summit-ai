import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { startups, watchlist } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/watchlist/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();
          const items = await db
            .select({ watchlist, startup: startups })
            .from(watchlist)
            .innerJoin(startups, eq(startups.id, watchlist.startupId))
            .where(eq(watchlist.investorId, user.id))
            .orderBy(desc(watchlist.createdAt));
          return jsonResponse(items);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List watchlist error:", error);
          return jsonResponse({ message: "Failed to load watchlist" }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "investor") {
            return jsonResponse({ message: "Only investors can save startups" }, 403);
          }

          const body = (await request.json()) as { startupId?: string };
          if (!body.startupId) {
            return jsonResponse({ message: "startupId is required" }, 400);
          }

          const [startup] = await db.select().from(startups).where(eq(startups.id, body.startupId));
          if (!startup || startup.status !== "published") {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const [existing] = await db
            .select()
            .from(watchlist)
            .where(and(eq(watchlist.investorId, user.id), eq(watchlist.startupId, body.startupId)));

          if (existing) {
            return jsonResponse(existing, 200);
          }

          const [item] = await db
            .insert(watchlist)
            .values({ investorId: user.id, startupId: body.startupId })
            .returning();

          return jsonResponse(item, 201);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Add to watchlist error:", error);
          return jsonResponse({ message: "Failed to save startup" }, 500);
        }
      },
    },
  },
});
