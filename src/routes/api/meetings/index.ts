import { createFileRoute } from "@tanstack/react-router";
import { asc, eq, or } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { meetings, startups, users } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/meetings/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();
          const items = await db
            .select()
            .from(meetings)
            .where(
              user.role === "investor" ? eq(meetings.investorId, user.id) : eq(meetings.founderId, user.id),
            )
            .orderBy(asc(meetings.scheduledAt));
          return jsonResponse(items);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List meetings error:", error);
          return jsonResponse({ message: "Failed to load meetings" }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "investor") {
            return jsonResponse({ message: "Only investors can schedule meetings" }, 403);
          }

          const body = (await request.json()) as {
            startupId?: string;
            title?: string;
            scheduledAt?: string;
            notes?: string;
          };

          if (!body.startupId || !body.title?.trim() || !body.scheduledAt) {
            return jsonResponse({ message: "startupId, title and scheduledAt are required" }, 400);
          }

          const [startup] = await db.select().from(startups).where(eq(startups.id, body.startupId));
          if (!startup) {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const scheduledAt = new Date(body.scheduledAt);
          if (Number.isNaN(scheduledAt.getTime())) {
            return jsonResponse({ message: "Invalid date" }, 400);
          }

          const [meeting] = await db
            .insert(meetings)
            .values({
              investorId: user.id,
              founderId: startup.founderId,
              startupId: startup.id,
              title: body.title.trim(),
              scheduledAt,
              notes: body.notes?.trim() || null,
            })
            .returning();

          return jsonResponse(meeting, 201);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Create meeting error:", error);
          return jsonResponse({ message: "Failed to schedule meeting" }, 500);
        }
      },
    },
  },
});
