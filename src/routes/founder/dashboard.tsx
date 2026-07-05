import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Sparkles,
  TrendingUp,
  Eye,
  Rocket,
  CheckCircle2,
  ArrowUpRight,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { PitchDeckUpload } from "@/components/pitch-deck/PitchDeckUpload";
import { FounderMatchList } from "@/components/matches/FounderMatchList";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/dashboard")({
  component: FounderDashboard,
});

const sidebarItems = founderSidebar("dashboard");

async function fetchStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups");
  if (!res.ok) throw new Error("Failed to load startups");
  return res.json();
}

function FounderDashboard() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

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

  const enabled = !isLoading && isAuthenticated && hasRole && user?.role === "founder";

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups"],
    queryFn: fetchStartups,
    enabled,
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalStartups = startups?.length ?? 0;
  const published = startups?.filter((s) => s.status === "published").length ?? 0;
  const aiAnalyses = startups?.filter((s) => s.detailedAnalysis).length ?? 0;

  const suggestionsSource = startups?.find(
    (s) => s.improvementSuggestions && s.improvementSuggestions.length > 0
  );

  const stats = [
    { label: "Total Startups", value: String(totalStartups), icon: Rocket, color: "text-primary", bg: "bg-accent" },
    { label: "Published", value: String(published), icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "AI Analyses", value: String(aiAnalyses), icon: TrendingUp, color: "text-warning", bg: "bg-warning/10" },
    { label: "Profile Views", value: "0", icon: Eye, color: "text-primary", bg: "bg-accent" },
  ];

  return (
    <DashboardLayout items={sidebarItems} title="Founder Dashboard">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <p className="text-sm text-muted-foreground">Here's what's happening with your startups.</p>
          </div>
        </div>
        <Link
          to="/founder/startups/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Rocket className="h-4 w-4" />
          Add New Startup
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">My Startups</h3>
            <Link to="/founder/startups" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all startups
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {startupsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !startups || startups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
              <h4 className="mt-3 font-semibold text-foreground">No startups yet</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first startup to unlock AI analysis and investor matching.
              </p>
              <Link
                to="/founder/startups/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Startup
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {startups.slice(0, 4).map((s) => {
                const score = s.detailedAnalysis?.investmentReadinessScore;
                return (
                  <Link
                    key={s.id}
                    to="/startups/$id"
                    params={{ id: s.id }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition hover:border-primary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <Rocket className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate font-medium text-foreground">{s.name}</h4>
                          <Badge variant={s.status === "published" ? "default" : "outline"} className="shrink-0">
                            {s.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.tagline || `${s.industry} · ${stageLabel(s.stage)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {score != null && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{score}</div>
                          <div className="text-[11px] text-muted-foreground">AI Score</div>
                        </div>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">AI Suggestions</h3>
          </div>

          {!suggestionsSource ? (
            <p className="text-sm text-muted-foreground">
              Generate an "Improve Pitch" analysis on one of your startups to see AI suggestions here.
            </p>
          ) : (
            <div className="space-y-4">
              {suggestionsSource.improvementSuggestions!.slice(0, 3).map((sug, i) => (
                <div key={i} className={i > 0 ? "border-t border-border pt-4" : ""}>
                  <h4 className="text-sm font-medium text-foreground">{sug.area}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{sug.suggestion}</p>
                  <Link
                    to="/founder/startups/$id/improve"
                    params={{ id: suggestionsSource.id }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PitchDeckUpload />
        <FounderMatchList />
      </div>
    </DashboardLayout>
  );
}
