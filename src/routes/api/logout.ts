import { createFileRoute } from "@tanstack/react-router";
import { getAuthSession, getEndSessionUrl } from "@/lib/server/auth";

export const Route = createFileRoute("/api/logout")({
  server: {
    handlers: {
      GET: async () => {
        const session = await getAuthSession();
        const endSessionUrl = await getEndSessionUrl();
        await session.clear();
        return new Response(null, { status: 302, headers: { Location: endSessionUrl } });
      },
    },
  },
});
