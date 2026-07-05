import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { startups } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/startups/discover")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireUser();
          const items = await db
            .select()
            .from(startups)
            .where(eq(startups.status, "published"))
            .orderBy(desc(startups.createdAt));
          return jsonResponse(items);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Discover startups error:", error);
          return jsonResponse({ message: "Failed to load startups" }, 500);
        }
      },
    },
  },
});
