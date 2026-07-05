import { createFileRoute } from "@tanstack/react-router";
import { and, eq, or } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { meetings, startups } from "@/lib/server/db/schema";
import { createNotification } from "@/lib/server/notifications";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ALLOWED_STATUSES = ["confirmed", "declined", "cancelled", "completed"] as const;

export const Route = createFileRoute("/api/meetings/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const body = (await request.json()) as {
            status?: string;
            meetingLink?: string;
          };

          const [existing] = await db.select().from(meetings).where(eq(meetings.id, params.id));
          if (!existing || (existing.founderId !== user.id && existing.investorId !== user.id)) {
            return jsonResponse({ message: "Meeting not found" }, 404);
          }

          const updates: Partial<typeof meetings.$inferInsert> = { updatedAt: new Date() };

          if (body.status) {
            if (!ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])) {
              return jsonResponse({ message: "Invalid status" }, 400);
            }
            if ((body.status === "confirmed" || body.status === "declined") && user.id !== existing.founderId) {
              return jsonResponse({ message: "Only the founder can confirm or decline" }, 403);
            }
            updates.status = body.status as (typeof ALLOWED_STATUSES)[number];
          }

          if (body.meetingLink !== undefined) {
            updates.meetingLink = body.meetingLink.trim() || null;
          }

          const [updated] = await db
            .update(meetings)
            .set(updates)
            .where(
              and(
                eq(meetings.id, params.id),
                or(eq(meetings.founderId, user.id), eq(meetings.investorId, user.id))
              )
            )
            .returning();

          if (updated && body.status) {
            const [startup] = await db.select().from(startups).where(eq(startups.id, updated.startupId));
            const startupName = startup?.name ?? "the startup";

            if (body.status === "confirmed") {
              await createNotification({
                userId: updated.investorId,
                type: "meeting_confirmed",
                title: "Meeting confirmed",
                body: `Your meeting request about ${startupName} was confirmed`,
                link: "/investor/meetings",
              });
            } else if (body.status === "declined") {
              await createNotification({
                userId: updated.investorId,
                type: "meeting_declined",
                title: "Meeting declined",
                body: `Your meeting request about ${startupName} was declined`,
                link: "/investor/meetings",
              });
            } else if (body.status === "cancelled") {
              const notifyUserId = user.id === updated.investorId ? updated.founderId : updated.investorId;
              const notifyLink = notifyUserId === updated.founderId ? "/founder/meetings" : "/investor/meetings";
              await createNotification({
                userId: notifyUserId,
                type: "meeting_cancelled",
                title: "Meeting cancelled",
                body: `The meeting about ${startupName} was cancelled`,
                link: notifyLink,
              });
            }
          }

          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Update meeting error:", error);
          return jsonResponse({ message: "Failed to update meeting" }, 500);
        }
      },
    },
  },
});
