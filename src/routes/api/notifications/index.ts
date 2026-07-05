import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { countUnread, listNotifications, markAllNotificationsRead } from "@/lib/server/notifications";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/notifications/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();
          const [items, unreadCount] = await Promise.all([
            listNotifications(user.id),
            countUnread(user.id),
          ]);
          return jsonResponse({ items, unreadCount });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List notifications error:", error);
          return jsonResponse({ message: "Failed to load notifications" }, 500);
        }
      },
      PATCH: async () => {
        try {
          const user = await requireUser();
          await markAllNotificationsRead(user.id);
          return jsonResponse({ message: "ok" });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Mark all notifications read error:", error);
          return jsonResponse({ message: "Failed to update notifications" }, 500);
        }
      },
    },
  },
});
