import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Lightbulb, FileWarning, PenLine, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { ImprovementSuggestion, PitchDeck, Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/startups/$id_/improve")({
  component: ImprovePitchPage,
});

const sidebarItems = founderSidebar("startups");

type TabId = "suggestions" | "missing_section" | "best_practice" | "examples";

const TABS: { id: TabId; label: string }[] = [
  { id: "suggestions", label: "Suggestions" },
  { id: "missing_section", label: "Missing Sections" },
  { id: "best_practice", label: "Best Practices" },
  { id: "examples", label: "Examples" },
];

const PRIORITY_STYLES: Record<ImprovementSuggestion["priority"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  low: "bg-success/10 text-success border-success/20",
};

const PRIORITY_LABEL: Record<ImprovementSuggestion["priority"], string> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

const CATEGORY_ICON: Record<ImprovementSuggestion["category"], typeof FileWarning> = {
  missing_section: FileWarning,
  weak_content: PenLine,
  best_practice: Award,
};

function SuggestionCard({ suggestion }: { suggestion: ImprovementSuggestion }) {
  const Icon = CATEGORY_ICON[suggestion.category] ?? Lightbulb;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <Badge variant="secondary">{suggestion.area}</Badge>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[suggestion.priority]}`}>
          {PRIORITY_LABEL[suggestion.priority]}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{suggestion.issue}</p>
      <p className="mt-1 text-sm text-muted-foreground">{suggestion.suggestion}</p>
      <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Example: </span>
        {suggestion.example}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "text-success" : score >= 50 ? "text-amber-500" : "text-destructive";
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

function ImprovePitchPage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("suggestions");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (!hasRole) {
      navigate({ to: "/select-role" });
      return;
    }
    if (user?.role !== "founder") {
      navigate({ to: "/investor/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole, user]);

  const { data, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) throw new Error("Failed to load startup");
      return res.json() as Promise<{ startup: Startup; deck: PitchDeck | null }>;
    },
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "founder",
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/startups/${id}/improve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to generate suggestions");
      return body as Startup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups", id] });
    },
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder" || detailLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const suggestions = data.startup.improvementSuggestions ?? [];
  const overallScore = data.deck?.analysis?.overallScore ?? null;

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...suggestions].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const filtered =
    tab === "suggestions"
      ? sorted
      : tab === "examples"
        ? sorted
        : sorted.filter((s) => s.category === tab);

  return (
    <DashboardLayout items={sidebarItems} title={`Improve Pitch — ${data.startup.name}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Improve Your Pitch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered suggestions to make your pitch deck better.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {overallScore !== null && (
              <div className="flex items-center gap-2">
                <ScoreRing score={overallScore} />
                <span className="text-xs text-muted-foreground">Overall Score</span>
              </div>
            )}
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {suggestions.length > 0 ? "Re-analyze Pitch Deck" : "Analyze my pitch deck"}
            </Button>
          </div>
        </div>

        {generateMutation.error && (
          <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
        )}

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold text-foreground">No suggestions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run the analysis to get concrete gaps and suggestions for improving your pitch deck.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "examples" ? (
              <div className="space-y-3">
                {filtered.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5">
                    <Badge variant="secondary">{s.area}</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">{s.example}</p>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nothing in this category — nice work!
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
