import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  FileText,
  Sparkles,
  Trash2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id/chat")({
  component: StartupChatPage,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sourcePages?: number[];
  usedWebSearch?: boolean;
};

function StartupChatPage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
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
  }, [isLoading, isAuthenticated, hasRole, navigate]);

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
        body: JSON.stringify({
          question: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to get an answer");
      return data as {
        answer: string;
        sourcePages: number[];
        suggestedQuestions: string[];
        usedWebSearch?: boolean;
      };
    },
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sourcePages: result.sourcePages,
          usedWebSearch: result.usedWebSearch,
        },
      ]);
      setSuggestedQuestions(result.suggestedQuestions ?? []);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
  });

  function sendQuestion(q: string) {
    if (!q || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setSuggestedQuestions([]);
    chatMutation.mutate(q);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleSend() {
    sendQuestion(question.trim());
  }

  function clearChat() {
    setMessages([]);
    setSuggestedQuestions([]);
  }

  const allSourcePages = Array.from(
    new Set(messages.flatMap((m) => m.sourcePages ?? []).sort((a, b) => a - b)),
  );

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems =
    user?.role === "investor" ? investorSidebar("discover") : founderSidebar("startups");

  return (
    <DashboardLayout items={sidebarItems} title={`AI Chat — ${detail?.startup?.name ?? ""}`}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex h-[70vh] flex-col rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold text-foreground">
                AI Chat with {detail?.startup?.name ?? "startup"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Ask anything about this startup's idea, business, market, or traction.
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear Chat
              </Button>
            )}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Ask anything about this startup's pitch deck — the AI will answer using its
                contents.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" &&
                    ((m.sourcePages && m.sourcePages.length > 0) || m.usedWebSearch) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.sourcePages?.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            <FileText className="h-3 w-3" /> Slide {p}
                          </span>
                        ))}
                        {m.usedWebSearch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                            <Globe className="h-3 w-3" /> Web search
                          </span>
                        )}
                      </div>
                    )}
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

          {suggestedQuestions.length > 0 && !chatMutation.isPending && (
            <div className="flex flex-wrap gap-2 border-t border-border p-3">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuestion(q)}
                  className="rounded-full border border-border bg-accent/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border p-4">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a follow-up question..."
            />
            <Button onClick={handleSend} disabled={!question.trim() || chatMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Sources
            </h4>
            {allSourcePages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sources referenced from the pitch deck will appear here as you chat.
              </p>
            ) : (
              <ul className="space-y-2">
                {allSourcePages.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Pitch Deck, Slide {p}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Suggested Questions
            </h4>
            {suggestedQuestions.length === 0 ? (
              <div className="space-y-2">
                {[
                  "What problem does this startup solve?",
                  "How does this startup make money?",
                  "Who are their main competitors?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuestion(q)}
                    className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuestion(q)}
                    className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
