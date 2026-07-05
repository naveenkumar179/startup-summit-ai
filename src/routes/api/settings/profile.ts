import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/settings/profile")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        try {
          const user = await requireUser();
          const body = (await request.json()) as { firstName?: string; lastName?: string };

          const [updated] = await db
            .update(users)
            .set({
              firstName: body.firstName?.trim() || null,
              lastName: body.lastName?.trim() || null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning();

          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Update profile error:", error);
          return jsonResponse({ message: "Failed to update profile" }, 500);
        }
      },
    },
  },
});
