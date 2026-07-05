import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { markNotificationRead } from "@/lib/server/notifications";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/notifications/$id")({
  server: {
    handlers: {
      PATCH: async ({ params }) => {
        try {
          const user = await requireUser();
          const updated = await markNotificationRead(user.id, params.id);
          if (!updated) {
            return jsonResponse({ message: "Not found" }, 404);
          }
          return jsonResponse(updated);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Mark notification read error:", error);
          return jsonResponse({ message: "Failed to update notification" }, 500);
        }
      },
    },
  },
});
