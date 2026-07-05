import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id/chat")({
  component: StartupChatPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

function StartupChatPage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (!hasRole) {
      navigate({ to: "/select-role" });
    }
  }, [isLoading, isAuthenticated, hasRole]);

  const { data: detail } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) throw new Error("Failed to load startup");
      return res.json() as Promise<{ startup: Startup }>;
    },
    enabled: !isLoading && isAuthenticated && hasRole,
  });

  const chatMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch(`/api/startups/${id}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to get an answer");
      return data.answer as string;
    },
    onSuccess: (answer, q) => {
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
  });

  function handleSend() {
    const q = question.trim();
    if (!q || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    chatMutation.mutate(q);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar("discover") : founderSidebar("startups");

  return (
    <DashboardLayout items={sidebarItems} title={`AI Chat — ${detail?.startup?.name ?? ""}`}>
      <div className="mx-auto flex h-[70vh] max-w-3xl flex-col rounded-2xl border border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Ask anything about this startup's pitch deck — the AI will answer using its contents.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
            </div>
          )}
          <div ref={scrollRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question about this pitch deck..."
          />
          <Button onClick={handleSend} disabled={!question.trim() || chatMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
