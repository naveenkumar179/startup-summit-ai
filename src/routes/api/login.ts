import { createFileRoute } from "@tanstack/react-router";
import { buildLoginRedirectUrl } from "@/lib/server/auth";

export const Route = createFileRoute("/api/login")({
  server: {
    handlers: {
      GET: async () => {
        const { url } = await buildLoginRedirectUrl();
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
