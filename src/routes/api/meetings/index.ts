import { createFileRoute } from "@tanstack/react-router";
import { desc, eq, or } from "drizzle-orm";
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
          const rows = await db
            .select({
              meeting: meetings,
              startup: startups,
              founder: users,
            })
            .from(meetings)
            .innerJoin(startups, eq(startups.id, meetings.startupId))
            .innerJoin(users, eq(users.id, meetings.founderId))
            .where(or(eq(meetings.founderId, user.id), eq(meetings.investorId, user.id)))
            .orderBy(desc(meetings.scheduledAt));

          if (user.role === "investor") {
            return jsonResponse(rows);
          }

          const investorIds = Array.from(new Set(rows.map((r) => r.meeting.investorId)));
          const investors = investorIds.length
            ? await db.select().from(users).where(or(...investorIds.map((id) => eq(users.id, id))))
            : [];
          const investorMap = new Map(investors.map((i) => [i.id, i]));

          return jsonResponse(
            rows.map((r) => ({ ...r, investor: investorMap.get(r.meeting.investorId) ?? null }))
          );
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
            return jsonResponse({ message: "Only investors can request meetings" }, 403);
          }

          const body = (await request.json()) as {
            startupId?: string;
            scheduledAt?: string;
            durationMinutes?: string;
            agenda?: string;
          };

          if (!body.startupId || !body.scheduledAt) {
            return jsonResponse({ message: "startupId and scheduledAt are required" }, 400);
          }

          const scheduledAt = new Date(body.scheduledAt);
          if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
            return jsonResponse({ message: "Please choose a valid future date and time" }, 400);
          }

          const [startup] = await db.select().from(startups).where(eq(startups.id, body.startupId));
          if (!startup || startup.status !== "published") {
            return jsonResponse({ message: "Startup not found" }, 404);
          }

          const [meeting] = await db
            .insert(meetings)
            .values({
              startupId: startup.id,
              founderId: startup.founderId,
              investorId: user.id,
              scheduledAt,
              durationMinutes: body.durationMinutes?.trim() || "30",
              agenda: body.agenda?.trim() || null,
              status: "pending",
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
