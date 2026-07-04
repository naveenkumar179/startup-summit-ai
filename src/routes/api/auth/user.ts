import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/server/auth";

export const Route = createFileRoute("/api/auth/user")({
  server: {
    handlers: {
      GET: async () => {
        const user = await getCurrentUser();
        if (!user) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify(user), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
