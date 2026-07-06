import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Rocket, Loader2, ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/investor/due-diligence")({
  component: DueDiligencePage,
});

const sidebarItems = investorSidebar("due-diligence");

function scoreLabel(score: number) {
  if (score >= 80) return "High Potential";
  if (score >= 60) return "Good Potential";
  return "Early Stage";
}

async function fetchDiscoverStartups(): Promise<Startup[]> {
  const res = await fetch("/api/startups/discover");
  if (!res.ok) throw new Error("Failed to load startups");
  return res.json();
}

function DueDiligencePage() {
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

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const analyzed = (startups ?? [])
    .filter((s) => s.detailedAnalysis)
    .sort(
      (a, b) =>
        (b.detailedAnalysis?.investmentReadinessScore ?? 0) -
        (a.detailedAnalysis?.investmentReadinessScore ?? 0),
    );
  const pending = (startups ?? []).filter((s) => !s.detailedAnalysis);

  return (
    <DashboardLayout items={sidebarItems} title="AI Due Diligence">
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">AI Due Diligence Reports</h2>
            <p className="text-sm text-muted-foreground">
              Our multi-agent pipeline (document, risk, research, report writer, and investment
              advisor agents) analyzes startups and produces investment-readiness reports. Open a
              startup to view or generate its report.
            </p>
          </div>
        </div>
      </div>

      <h3 className="mb-3 font-semibold text-foreground">Reports available ({analyzed.length})</h3>
      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : analyzed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-3 font-semibold text-foreground">No reports generated yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a startup from Discover and run AI due diligence to generate its first report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyzed.map((s) => {
            const score = s.detailedAnalysis!.investmentReadinessScore;
            return (
              <Link
                key={s.id}
                to="/startups/$id"
                params={{ id: s.id }}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
              >
                <Badge
                  className="w-fit gap-1 bg-accent text-primary hover:bg-accent"
                  variant="secondary"
                >
                  <Sparkles className="h-3 w-3" />
                  Report Ready
                </Badge>
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
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{stageLabel(s.stage)}</Badge>
                  {s.fundingRequired && <Badge variant="outline">{s.fundingRequired}</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    className="gap-1 bg-success/10 text-success hover:bg-success/10"
                    variant="secondary"
                  >
                    {score} {scoreLabel(score)}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    View Report
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 font-semibold text-foreground">
            Awaiting analysis ({pending.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((s) => (
              <Link
                key={s.id}
                to="/startups/$id"
                params={{ id: s.id }}
                className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-card p-5 transition hover:border-primary/50"
              >
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
                    <p className="text-xs text-muted-foreground">{s.industry}</p>
                  </div>
                </div>
                <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Run Due Diligence
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
