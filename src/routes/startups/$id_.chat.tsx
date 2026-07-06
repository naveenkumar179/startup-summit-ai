import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Send,
  Bot,
  User as UserIcon,
  FileText,
  Sparkles,
  Trash2,
  Globe,
  ArrowLeft,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id_/chat")({
  component: StartupChatPage,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sourcePages?: number[];
  usedWebSearch?: boolean;
};

const STARTER_PROMPTS = [
  { icon: Zap, label: "Core problem", q: "What problem does this startup solve?" },
  { icon: DollarSign, label: "Revenue model", q: "How does this startup make money?" },
  { icon: Users, label: "Target market", q: "Who is the target customer and how big is the market?" },
  { icon: TrendingUp, label: "Traction", q: "What traction or milestones has this startup achieved?" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function StartupChatPage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    if (!hasRole) navigate({ to: "/select-role" });
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
    if (!q.trim() || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: q.trim() }]);
    setQuestion("");
    setSuggestedQuestions([]);
    chatMutation.mutate(q.trim());
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(question);
    }
  }

  function clearChat() {
    setMessages([]);
    setSuggestedQuestions([]);
  }

  const allSourcePages = Array.from(
    new Set(messages.flatMap((m) => m.sourcePages ?? []).sort((a, b) => a - b)),
  );
  const startupName = detail?.startup?.name ?? "this startup";

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems =
    user?.role === "investor" ? investorSidebar("discover") : founderSidebar("startups");

  const noDeck = detail && !detail.startup?.pitchDeckId;

  return (
    <DashboardLayout items={sidebarItems} title={`AI Chat — ${startupName}`}>
      {noDeck ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No pitch deck linked</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Link a pitch deck to this startup to enable AI Chat. The AI will answer questions based
            on the deck&apos;s contents.
          </p>
          {user?.role === "founder" && (
            <a
              href={`/founder/startups/${id}/edit`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Link a pitch deck →
            </a>
          )}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-background to-background px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Link to="/startups/$id" params={{ id }}>
                <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-foreground">
                  AI Chat
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{startupName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(allSourcePages.length > 0) && (
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-accent/50 px-3 py-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 text-primary" />
                  {allSourcePages.length} slide{allSourcePages.length !== 1 ? "s" : ""} referenced
                </div>
              )}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Chat Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  /* Welcome state */
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                      <Bot className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Ask me anything about {startupName}
                    </h2>
                    <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                      I&apos;ve read the pitch deck and can answer questions about the business,
                      market, team, financials, and more.
                    </p>
                    <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-2.5">
                      {STARTER_PROMPTS.map(({ icon: Icon, label, q }) => (
                        <button
                          key={q}
                          onClick={() => sendQuestion(q)}
                          className="group flex flex-col gap-1.5 rounded-xl border border-border bg-accent/30 p-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {label}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-foreground">{q}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="space-y-6 px-5 py-6">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.role === "assistant" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <div className="flex max-w-[76%] flex-col gap-1.5">
                          <div
                            className={
                              m.role === "user"
                                ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm"
                                : "rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm"
                            }
                          >
                            {m.content}
                          </div>
                          {m.role === "assistant" &&
                            ((m.sourcePages && m.sourcePages.length > 0) || m.usedWebSearch) && (
                              <div className="flex flex-wrap gap-1.5 px-1">
                                {m.sourcePages?.map((p) => (
                                  <span
                                    key={p}
                                    className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                  >
                                    <FileText className="h-2.5 w-2.5 text-primary" />
                                    Slide {p}
                                  </span>
                                ))}
                                {m.usedWebSearch && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                                    <Globe className="h-2.5 w-2.5" />
                                    Web search
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        {m.role === "user" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}

                    {chatMutation.isPending && (
                      <div className="flex justify-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3 shadow-sm">
                          <TypingDots />
                        </div>
                      </div>
                    )}

                    {/* Suggested follow-ups */}
                    {suggestedQuestions.length > 0 && !chatMutation.isPending && (
                      <div className="flex flex-col gap-2 pl-10">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Follow-up questions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => sendQuestion(q)}
                              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary/40 hover:bg-primary/10"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={scrollRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border bg-background/80 p-4 backdrop-blur-sm">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-4 py-3 shadow-sm ring-0 transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask anything about ${startupName}…`}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    style={{ maxHeight: "120px" }}
                  />
                  <Button
                    size="sm"
                    onClick={() => sendQuestion(question)}
                    disabled={!question.trim() || chatMutation.isPending}
                    className="h-8 w-8 shrink-0 rounded-lg p-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-muted-foreground/50">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>

            {/* Right panel */}
            <div className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-accent/20 p-4 lg:flex">
              {/* Sources */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3 w-3 text-primary" />
                  Sources
                </h4>
                {allSourcePages.length === 0 ? (
                  <p className="text-xs leading-relaxed text-muted-foreground/70">
                    Slide references will appear here as you chat.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {allSourcePages.map((p) => (
                      <div
                        key={p}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground"
                      >
                        <FileText className="h-3 w-3 shrink-0 text-primary" />
                        Slide {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Suggested questions */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Suggested questions
                </h4>
                <div className="space-y-1.5">
                  {(suggestedQuestions.length > 0 ? suggestedQuestions : STARTER_PROMPTS.map((p) => p.q)).map(
                    (q, i) => (
                      <button
                        key={i}
                        onClick={() => sendQuestion(q)}
                        className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                      >
                        {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
