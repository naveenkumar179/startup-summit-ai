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
  Plus,
  FileText,
  Zap,
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

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : score >= 45
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Zap className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

function FounderDashboard() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    if (!hasRole) { navigate({ to: "/select-role" }); return; }
    if (user?.role !== "founder") navigate({ to: "/investor/dashboard" });
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
  const totalViews = startups?.reduce((sum, s) => sum + (s.viewCount ?? 0), 0) ?? 0;

  const suggestionsSource = startups?.find(
    (s) => s.improvementSuggestions && s.improvementSuggestions.length > 0,
  );

  const stats = [
    {
      label: "Total Startups",
      value: totalStartups,
      icon: Rocket,
      gradient: "from-violet-500/20 to-violet-500/5",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Published",
      value: published,
      icon: CheckCircle2,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "AI Analyses",
      value: aiAnalyses,
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Profile Views",
      value: totalViews,
      icon: Eye,
      gradient: "from-sky-500/20 to-sky-500/5",
      iconColor: "text-sky-500",
      iconBg: "bg-sky-500/10",
    },
  ];

  return (
    <DashboardLayout items={sidebarItems} title="Dashboard">
      {/* Hero banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Founder Hub
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalStartups === 0
                ? "Add your first startup and let AI match you with the right investors."
                : `You have ${totalStartups} startup${totalStartups !== 1 ? "s" : ""} · ${published} published · ${totalViews} total views`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to="/founder/pitch-decks"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
            >
              <FileText className="h-4 w-4" />
              Pitch Decks
            </Link>
            <Link
              to="/founder/startups/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Startup
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.gradient} p-5`}
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.iconBg}`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Startup list */}
        <div className="rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">My Startups</h3>
            </div>
            <Link
              to="/founder/startups"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-3">
            {startupsLoading ? (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !startups || startups.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Rocket className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="mt-3 font-semibold text-foreground">No startups yet</h4>
                <p className="mt-1 max-w-[22rem] text-sm text-muted-foreground">
                  Add your first startup to unlock AI analysis and investor matching.
                </p>
                <Link
                  to="/founder/startups/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Startup
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {startups.slice(0, 5).map((s) => {
                  const score = s.detailedAnalysis?.investmentReadinessScore;
                  return (
                    <Link
                      key={s.id}
                      to="/startups/$id"
                      params={{ id: s.id }}
                      className="flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-accent/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {s.logoUrl ? (
                          <img
                            src={s.logoUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-border"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Rocket className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {s.name}
                            </span>
                            <Badge
                              variant={s.status === "published" ? "default" : "outline"}
                              className="shrink-0 text-[10px] px-1.5 py-0"
                            >
                              {s.status === "published" ? "Live" : "Draft"}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.tagline || `${s.industry} · ${stageLabel(s.stage)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {score != null && <ScoreBadge score={score} />}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground">AI Suggestions</h3>
          </div>
          <div className="p-4">
            {!suggestionsSource ? (
              <div className="rounded-xl bg-accent/40 p-4 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Run &quot;Improve Pitch&quot; on a startup to see AI-generated suggestions here.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {suggestionsSource.improvementSuggestions!.slice(0, 3).map((sug, i) => (
                  <div
                    key={i}
                    className={`${i > 0 ? "border-t border-border pt-3.5" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h4 className="text-sm font-semibold text-foreground">{sug.area}</h4>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {sug.suggestion}
                    </p>
                    <Link
                      to="/founder/startups/$id/improve"
                      params={{ id: suggestionsSource.id }}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Improve pitch
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PitchDeckUpload />
        <FounderMatchList />
      </div>
    </DashboardLayout>
  );
}
