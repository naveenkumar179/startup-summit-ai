import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Rocket, Loader2, ArrowUpRight, Zap, Eye, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/startups/")({
  component: MyStartupsPage,
});

const sidebarItems = founderSidebar("startups");

async function fetchStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups");
  if (!res.ok) throw new Error("Failed to load startups");
  return res.json();
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : score >= 45
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      <Zap className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

function MyStartupsPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    if (!hasRole) { navigate({ to: "/select-role" }); return; }
    if (user?.role !== "founder") navigate({ to: "/investor/dashboard" });
  }, [isLoading, isAuthenticated, hasRole, user]);

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups"],
    queryFn: fetchStartups,
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "founder",
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const published = startups?.filter((s) => s.status === "published").length ?? 0;

  return (
    <DashboardLayout items={sidebarItems} title="My Startups">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Startups</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {startups
              ? `${startups.length} startup${startups.length !== 1 ? "s" : ""} · ${published} published`
              : "Manage your startup profiles and pitch decks."}
          </p>
        </div>
        <Link
          to="/founder/startups/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Startup
        </Link>
      </div>

      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !startups || startups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Rocket className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No startups yet</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Add your first startup to unlock AI analysis, investor matching, and pitch deck tools.
          </p>
          <Link
            to="/founder/startups/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Your First Startup
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => {
            const score = s.detailedAnalysis?.investmentReadinessScore;
            return (
              <Link key={s.id} to="/startups/$id" params={{ id: s.id }} className="group block">
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Rocket className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-foreground">{s.name}</h4>
                        {s.tagline && (
                          <p className="truncate text-xs text-muted-foreground">{s.tagline}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={s.status === "published" ? "default" : "outline"}
                      className="shrink-0 text-[10px] px-2 py-0.5"
                    >
                      {s.status === "published" ? "Live" : "Draft"}
                    </Badge>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[11px]">{s.industry}</Badge>
                    <Badge variant="secondary" className="text-[11px]">{stageLabel(s.stage)}</Badge>
                    {score != null && <ScoreBadge score={score} />}
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {s.viewCount ?? 0} views
                    </span>
                    {s.detailedAnalysis && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Zap className="h-3 w-3" />
                        AI analysis ready
                      </span>
                    )}
                  </div>

                  {/* AI feature links */}
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    <Link
                      to="/startups/$id/chat"
                      params={{ id: s.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-lg bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Chat
                    </Link>
                    <Link
                      to="/startups/$id/due-diligence"
                      params={{ id: s.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-lg bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Due Diligence
                    </Link>
                    <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary">
                      View
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
