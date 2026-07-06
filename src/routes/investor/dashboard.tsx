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
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (!hasRole) {
      navigate({ to: "/select-role" });
      return;
    }
    if (user?.role !== "investor") {
      navigate({ to: "/founder/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole, user]);

  const enabled = !isLoading && isAuthenticated && hasRole && user?.role === "investor";

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups/discover"],
    queryFn: fetchDiscoverStartups,
    enabled,
  });

  const { data: watchlistIds } = useQuery({
    queryKey: ["/api/watchlist", "ids"],
    queryFn: fetchWatchlistIds,
    enabled,
  });

  const { data: conversationCount } = useQuery({
    queryKey: ["/api/conversations", "count"],
    queryFn: fetchConversationCount,
    enabled,
  });

  const ranked = useMemo(() => {
    return [...(startups ?? [])].sort((a, b) => {
      const sa = a.detailedAnalysis?.investmentReadinessScore ?? -1;
      const sb = b.detailedAnalysis?.investmentReadinessScore ?? -1;
      return sb - sa;
    });
  }, [startups]);

  const topStartups = ranked.slice(0, 3);
  const recommended = ranked.slice(0, 5);

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const reportsAvailable = startups?.filter((s) => s.detailedAnalysis).length ?? 0;

  const stats = [
    {
      label: "Startups Reviewed",
      value: String(startups?.length ?? 0),
      icon: Rocket,
      color: "text-primary",
      bg: "bg-accent",
    },
    {
      label: "Saved Startups",
      value: String(watchlistIds?.length ?? 0),
      icon: Bookmark,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "AI Reports Available",
      value: String(reportsAvailable),
      icon: ShieldCheck,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Active Conversations",
      value: String(conversationCount ?? 0),
      icon: MessageSquare,
      color: "text-primary",
      bg: "bg-accent",
    },
  ];

  return (
    <DashboardLayout items={sidebarItems} title="Investor Dashboard">
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Discover vetted startups and use AI-powered due diligence to make smarter decisions.
            </p>
          </div>
        </div>
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

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Discover Innovative Startups</h3>
          <Link
            to="/investor/discover"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {startupsLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : topStartups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-3 font-semibold text-foreground">No startups published yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon as founders publish new startups.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topStartups.map((s) => {
              const score = s.detailedAnalysis?.investmentReadinessScore;
              return (
                <Link
                  key={s.id}
                  to="/startups/$id"
                  params={{ id: s.id }}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
                >
                  {score != null && (
                    <Badge
                      className="w-fit gap-1 bg-accent text-primary hover:bg-accent"
                      variant="secondary"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Analysis
                    </Badge>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <Rocket className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">{s.industry}</p>
                    </div>
                  </div>
                  {s.tagline && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.tagline}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{stageLabel(s.stage)}</Badge>
                    {s.fundingRequired && <Badge variant="outline">{s.fundingRequired}</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {score != null ? (
                      <Badge
                        className="gap-1 bg-success/10 text-success hover:bg-success/10"
                        variant="secondary"
                      >
                        {score} {scoreLabel(score)}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      View Details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {recommended.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Recommended for you</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Startup</th>
                  <th className="pb-2 pr-4 font-medium">Industry</th>
                  <th className="pb-2 pr-4 font-medium">Stage</th>
                  <th className="pb-2 pr-4 font-medium">AI Score</th>
                  <th className="pb-2 pr-4 font-medium">Funding</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recommended.map((s) => {
                  const score = s.detailedAnalysis?.investmentReadinessScore;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {s.logoUrl ? (
                            <img
                              src={s.logoUrl}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                              <Rocket className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.industry}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{stageLabel(s.stage)}</td>
                      <td className="py-3 pr-4">
                        {score != null ? (
                          <Badge
                            variant="secondary"
                            className="bg-success/10 text-success hover:bg-success/10"
                          >
                            {score}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.fundingRequired ?? "—"}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/startups/$id"
                          params={{ id: s.id }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View
                          <ArrowUpRight className="h-3.5 w-3.5" />
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
