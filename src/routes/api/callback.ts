import { createFileRoute } from "@tanstack/react-router";
import { handleAuthCallback } from "@/lib/server/auth";

export const Route = createFileRoute("/api/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        try {
          const { success } = await handleAuthCallback(url);
          if (!success) {
            return new Response(null, { status: 302, headers: { Location: "/api/login" } });
          }
          return new Response(null, { status: 302, headers: { Location: "/" } });
        } catch (error) {
          console.error("Auth callback error:", error);
          return new Response(null, { status: 302, headers: { Location: "/api/login" } });
        }
      },
    },
  },
});
