import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/auth";
import {
  getConversationById,
  isParticipant,
  listMessages,
  sendMessage,
} from "@/lib/server/messaging";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/conversations/$id/messages")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const user = await requireUser();
          const conversation = await getConversationById(params.id);
          if (!conversation || !isParticipant(conversation, user.id)) {
            return jsonResponse({ message: "Conversation not found" }, 404);
          }
          const items = await listMessages(conversation.id);
          return jsonResponse({ messages: items });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("List messages error:", error);
          return jsonResponse({ message: "Failed to load messages" }, 500);
        }
      },
      POST: async ({ request, params }) => {
        try {
          const user = await requireUser();
          const conversation = await getConversationById(params.id);
          if (!conversation || !isParticipant(conversation, user.id)) {
            return jsonResponse({ message: "Conversation not found" }, 404);
          }

          const body = (await request.json()) as { content?: string };
          const content = body.content?.trim();
          if (!content) {
            return jsonResponse({ message: "Message content is required" }, 400);
          }
          if (content.length > 4000) {
            return jsonResponse({ message: "Message is too long" }, 400);
          }

          const message = await sendMessage(conversation.id, user.id, content);
          return jsonResponse({ message: "ok", data: message }, 201);
        } catch (error) {
          if (error instanceof Response) return error;
          console.error("Send message error:", error);
          return jsonResponse({ message: "Failed to send message" }, 500);
        }
      },
    },
  },
});
