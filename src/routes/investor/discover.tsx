import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Rocket,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Heart,
  SlidersHorizontal,
  Zap,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import { INDUSTRY_OPTIONS, stageLabel, STAGE_OPTIONS } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

function scoreLabel(score: number) {
  if (score >= 80) return "High Potential";
  if (score >= 60) return "Good Potential";
  return "Early Stage";
}
function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
  if (score >= 45) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
  return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
}

export const Route = createFileRoute("/investor/discover")({
  component: DiscoverStartupsPage,
});

const sidebarItems = investorSidebar("discover");

async function fetchDiscoverStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups/discover");
  if (!res.ok) throw new Error("Failed to load startups");
  return res.json();
}

function DiscoverStartupsPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [stage, setStage] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    if (!hasRole) { navigate({ to: "/select-role" }); return; }
    if (user?.role !== "investor") navigate({ to: "/founder/dashboard" });
  }, [isLoading, isAuthenticated, hasRole, user]);

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups/discover"],
    queryFn: fetchDiscoverStartups,
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "investor",
  });

  const { data: watchlistIds } = useQuery({
    queryKey: ["/api/watchlist", "ids"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) return [] as string[];
      const items = (await res.json()) as { watchlist: { startupId: string } }[];
      return items.map((i) => i.watchlist.startupId);
    },
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "investor",
  });

  const toggleWatchlist = useMutation({
    mutationFn: async ({ startupId, saved }: { startupId: string; saved: boolean }) => {
      if (saved) {
        const res = await fetch(`/api/watchlist/${startupId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to update watchlist");
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ startupId }),
        });
        if (!res.ok) throw new Error("Failed to update watchlist");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const filtered = useMemo(() => {
    return (startups ?? []).filter((s) => {
      if (industry !== "all" && s.industry !== industry) return false;
      if (stage !== "all" && s.stage !== stage) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        if (!s.name.toLowerCase().includes(term) && !s.tagline?.toLowerCase().includes(term))
          return false;
      }
      return true;
    });
  }, [startups, industry, stage, search]);

  const hasFilters = search || industry !== "all" || stage !== "all";

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Discover Startups">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Discover Startups</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {startups
                ? `${startups.length} published startup${startups.length !== 1 ? "s" : ""} · ${startups.filter((s) => s.detailedAnalysis).length} with AI reports`
                : "Browse and filter AI-vetted startups from our network"}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setIndustry("all"); setStage("all"); }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tagline…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-9 w-[168px] rounded-xl text-sm">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRY_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-9 w-[148px] rounded-xl text-sm">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading startups…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <Rocket className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">No startups found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setIndustry("all"); setStage("all"); }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const score = s.detailedAnalysis?.investmentReadinessScore;
            const saved = watchlistIds?.includes(s.id) ?? false;
            return (
              <div
                key={s.id}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Card top */}
                <div className="flex items-start justify-between p-4 pb-0">
                  <div className="flex items-center gap-3">
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
                    <div>
                      <h4 className="font-semibold leading-tight text-foreground">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">{s.industry}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWatchlist.mutate({ startupId: s.id, saved });
                    }}
                    disabled={toggleWatchlist.isPending}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      saved
                        ? "bg-rose-500/10 text-rose-500"
                        : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                  </button>
                </div>

                <Link to="/startups/$id" params={{ id: s.id }} className="flex flex-1 flex-col p-4 pt-3">
                  {s.tagline && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {s.tagline}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[11px]">{stageLabel(s.stage)}</Badge>
                    {s.fundingRequired && (
                      <Badge variant="outline" className="text-[11px]">{s.fundingRequired}</Badge>
                    )}
                    {score != null && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${scoreColor(score)}`}>
                        <Zap className="h-2.5 w-2.5" />
                        {score} · {scoreLabel(score)}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    {score != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                        AI Report Ready
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      View details
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
