import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import { getOrCreateConversation, listConversationsForUser } from "@/lib/server/messaging";
import { db } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/conversations/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireUser();
          if (user.role !== "founder" && user.role !== "investor") {
            return jsonResponse({ conversations: [] });
          }
          const conversations = await listConversationsForUser(user.id, user.role);
          return jsonResponse({ conversations });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List conversations error:", error);
          return jsonResponse({ message: "Failed to load conversations" }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireUser();
          if (user.role !== "founder" && user.role !== "investor") {
            return jsonResponse({ message: "Only founders and investors can message" }, 403);
          }

          const body = (await request.json()) as { otherUserId?: string };
          if (!body.otherUserId) {
            return jsonResponse({ message: "otherUserId is required" }, 400);
          }

          const [otherUser] = await db.select().from(users).where(eq(users.id, body.otherUserId));
          if (!otherUser) {
            return jsonResponse({ message: "User not found" }, 404);
          }

          let founderId: string;
          let investorId: string;

          if (user.role === "founder") {
            if (otherUser.role !== "investor") {
              return jsonResponse({ message: "Founders can only message investors" }, 400);
            }
            founderId = user.id;
            investorId = otherUser.id;
          } else {
            if (otherUser.role !== "founder") {
              return jsonResponse({ message: "Investors can only message founders" }, 400);
            }
            founderId = otherUser.id;
            investorId = user.id;
          }

          const conversation = await getOrCreateConversation(founderId, investorId);
          return jsonResponse({ conversation, otherUser });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Create conversation error:", error);
          return jsonResponse({ message: "Failed to start conversation" }, 500);
        }
      },
    },
  },
});
