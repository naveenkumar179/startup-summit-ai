import { createFileRoute } from "@tanstack/react-router";
import { and, eq, or } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { meetings, meetingStatusEnum } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const VALID_STATUSES = meetingStatusEnum.enumValues;

export const Route = createFileRoute("/api/meetings/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const [meeting] = await db.select().from(meetings).where(eq(meetings.id, params.id));
          if (!meeting || (meeting.investorId !== user.id && meeting.founderId !== user.id)) {
            return jsonResponse({ message: "Meeting not found" }, 404);
          }

          const body = (await request.json()) as { status?: string };
          if (!body.status || !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
            return jsonResponse({ message: "Invalid status" }, 400);
          }

          const [updated] = await db
            .update(meetings)
            .set({ status: body.status as (typeof VALID_STATUSES)[number] })
            .where(eq(meetings.id, params.id))
            .returning();

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
