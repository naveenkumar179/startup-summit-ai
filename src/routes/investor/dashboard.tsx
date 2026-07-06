import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Rocket,
  ShieldCheck,
  Sparkles,
  Bookmark,
  MessageSquare,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Zap,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { investorSidebar } from "@/components/dashboard/sidebars";
import { InvestorMatchList } from "@/components/matches/InvestorMatchList";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

function scoreLabel(score: number) {
  if (score >= 80) return "High Potential";
  if (score >= 60) return "Good Potential";
  return "Early Stage";
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function ScoreRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-xs font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export const Route = createFileRoute("/investor/dashboard")({
  component: InvestorDashboard,
});

const sidebarItems = investorSidebar("dashboard");

async function fetchDiscoverStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups/discover");
  if (!res.ok) throw new Error("Failed to load startups");
  return res.json();
}
async function fetchWatchlistIds(): Promise<string[]> {
  const res = await fetch("/api/watchlist");
  if (!res.ok) return [];
  const items = (await res.json()) as { watchlist: { startupId: string } }[];
  return items.map((i) => i.watchlist.startupId);
}
async function fetchConversationCount(): Promise<number> {
  const res = await fetch("/api/conversations");
  if (!res.ok) return 0;
  const data = (await res.json()) as { conversations: unknown[] };
  return data.conversations?.length ?? 0;
}

function InvestorDashboard() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    if (!hasRole) { navigate({ to: "/select-role" }); return; }
    if (user?.role !== "investor") navigate({ to: "/founder/dashboard" });
  }, [isLoading, isAuthenticated, hasRole, user]);

  const enabled = !isLoading && isAuthenticated && hasRole && user?.role === "investor";

  const { data: startups, isLoading: startupsLoading } = useQuery({ queryKey: ["/api/startups/discover"], queryFn: fetchDiscoverStartups, enabled });
  const { data: watchlistIds } = useQuery({ queryKey: ["/api/watchlist", "ids"], queryFn: fetchWatchlistIds, enabled });
  const { data: conversationCount } = useQuery({ queryKey: ["/api/conversations", "count"], queryFn: fetchConversationCount, enabled });

  const ranked = useMemo(
    () =>
      [...(startups ?? [])].sort((a, b) => {
        const sa = a.detailedAnalysis?.investmentReadinessScore ?? -1;
        const sb = b.detailedAnalysis?.investmentReadinessScore ?? -1;
        return sb - sa;
      }),
    [startups],
  );

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const reportsAvailable = startups?.filter((s) => s.detailedAnalysis).length ?? 0;
  const topStartups = ranked.slice(0, 3);
  const tableStartups = ranked.slice(0, 6);

  const stats = [
    {
      label: "Available Startups",
      value: startups?.length ?? 0,
      icon: Rocket,
      gradient: "from-violet-500/15 to-violet-500/5",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Saved",
      value: watchlistIds?.length ?? 0,
      icon: Bookmark,
      gradient: "from-emerald-500/15 to-emerald-500/5",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "AI Reports",
      value: reportsAvailable,
      icon: ShieldCheck,
      gradient: "from-sky-500/15 to-sky-500/5",
      iconColor: "text-sky-500",
      iconBg: "bg-sky-500/10",
    },
    {
      label: "Conversations",
      value: conversationCount ?? 0,
      icon: MessageSquare,
      gradient: "from-amber-500/15 to-amber-500/5",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <DashboardLayout items={sidebarItems} title="Dashboard">
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3 w-3" />
              Investor Hub
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {startups?.length
                ? `${startups.length} startup${startups.length !== 1 ? "s" : ""} available · ${reportsAvailable} with AI reports`
                : "Discover vetted startups and use AI due diligence to invest smarter."}
            </p>
          </div>
          <Link
            to="/investor/discover"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            Discover Startups
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.gradient} p-5`}
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.iconBg}`}>
              <s.icon className={`h-4 w-4 ${s.iconColor}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top startup cards */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Top Ranked Startups</h3>
        </div>
        <Link
          to="/investor/discover"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : topStartups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Rocket className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h4 className="mt-3 font-semibold text-foreground">No startups published yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon as founders publish new startups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          {topStartups.map((s) => {
            const score = s.detailedAnalysis?.investmentReadinessScore;
            return (
              <Link
                key={s.id}
                to="/startups/$id"
                params={{ id: s.id }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-border" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Rocket className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground leading-tight">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">{s.industry}</p>
                    </div>
                  </div>
                  {score != null && <ScoreRing score={score} />}
                </div>

                {s.tagline && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {s.tagline}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{stageLabel(s.stage)}</Badge>
                  {s.fundingRequired && (
                    <Badge variant="outline" className="text-[10px]">{s.fundingRequired}</Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {score != null && (
                    <span className={`text-xs font-semibold ${scoreColor(score)}`}>
                      {scoreLabel(score)}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary">
                    View Details
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recommended table */}
      {tableStartups.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">AI-Ranked Pipeline</h3>
            </div>
            <Link to="/investor/discover" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Explore more <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Startup</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Industry</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Score</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funding Ask</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {tableStartups.map((s, idx) => {
                  const score = s.detailedAnalysis?.investmentReadinessScore;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-accent/40 ${idx % 2 === 0 ? "" : "bg-accent/10"}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-border" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <Rocket className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{s.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{s.industry}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant="secondary" className="text-[11px]">{stageLabel(s.stage)}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {score != null ? (
                          <span className={`inline-flex items-center gap-1 rounded-full bg-current/5 px-2 py-0.5 text-xs font-bold ${scoreColor(score)}`}>
                            <Zap className="h-2.5 w-2.5" />
                            {score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{s.fundingRequired ?? "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/startups/$id"
                          params={{ id: s.id }}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          View
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InvestorMatchList />
    </DashboardLayout>
  );
}
