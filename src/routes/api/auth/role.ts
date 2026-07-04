import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { users, type UserRole } from "@/lib/server/db/schema";

const VALID_ROLES: UserRole[] = ["founder", "investor"];

export const Route = createFileRoute("/api/auth/role")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          const body = (await request.json()) as { role?: string };

          if (!body.role || !VALID_ROLES.includes(body.role as UserRole)) {
            return new Response(JSON.stringify({ message: "Invalid role" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const [updated] = await db
            .update(users)
            .set({ role: body.role as UserRole, updatedAt: new Date() })
            .where(eq(users.id, user.id))
            .returning();

          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Set role error:", error);
          return new Response(JSON.stringify({ message: "Failed to set role" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
