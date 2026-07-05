import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Rocket, Loader2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups/discover"],
    queryFn: fetchDiscoverStartups,
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "investor",
  });

  const filtered = useMemo(() => {
    return (startups ?? []).filter((s) => {
      if (industry !== "all" && s.industry !== industry) return false;
      if (stage !== "all" && s.stage !== stage) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        if (!s.name.toLowerCase().includes(term) && !s.tagline?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [startups, industry, stage, search]);

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Discover Startups">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startups..."
            className="pl-9"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {INDUSTRY_OPTIONS.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGE_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No startups found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.id} to="/startups/$id" params={{ id: s.id }} className="block">
              <div className="h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50">
                <div className="flex items-center gap-3">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground">{s.name}</h4>
                    <p className="text-xs text-muted-foreground">{s.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{s.industry}</Badge>
                  <Badge variant="secondary">{stageLabel(s.stage)}</Badge>
                  {s.fundingRequired && <Badge variant="outline">Raising {s.fundingRequired}</Badge>}
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  View details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
