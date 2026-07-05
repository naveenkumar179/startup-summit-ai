import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message, User } from "@/lib/server/db/schema";

type ConversationSummary = {
  conversation: Conversation;
  otherUser: User | null;
  lastMessage: Message | null;
};

async function fetchConversations(): Promise<{ conversations: ConversationSummary[] }> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

async function fetchMessages(conversationId: string): Promise<{ messages: Message[] }> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

function otherUserName(u: User | null | undefined) {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Unknown";
}

function initials(u: User | null | undefined) {
  if (!u) return "?";
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function ConversationView({ initialOtherUserId }: { initialOtherUserId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: fetchConversations,
    refetchInterval: 5000,
  });

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to start conversation");
      return body;
    },
    onSuccess: (body) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedId(body.conversation.id);
    },
  });

  useEffect(() => {
    if (initialOtherUserId) {
      startConversation.mutate(initialOtherUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOtherUserId]);

  useEffect(() => {
    if (!selectedId && data?.conversations?.length) {
      setSelectedId(data.conversations[0].conversation.id);
    }
  }, [data, selectedId]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedId, "messages"],
    queryFn: () => fetchMessages(selectedId as string),
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messagesData]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to send message");
      return body;
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const conversations = data?.conversations ?? [];
  const selected = conversations.find((c) => c.conversation.id === selectedId);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold text-foreground">
          Conversations
        </div>
        <div className="max-h-[60vh] overflow-y-auto md:max-h-[calc(100vh-13rem)]">
          {isLoading && (
            <div className="p-6 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Start one from your matches.
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.conversation.id}
              onClick={() => setSelectedId(c.conversation.id)}
              className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors ${
                c.conversation.id === selectedId ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials(c.otherUser)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {otherUserName(c.otherUser)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.lastMessage?.content ?? "No messages yet"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[400px] flex-col rounded-2xl border border-border bg-card">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials(selected.otherUser)}
              </div>
              <div className="font-medium text-foreground">{otherUserName(selected.otherUser)}</div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messagesLoading && (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {messagesData?.messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              {messagesData && messagesData.messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Say hello to start the conversation.
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) sendMutation.mutate(draft.trim());
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || sendMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
