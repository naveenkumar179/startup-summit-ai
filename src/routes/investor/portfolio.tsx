import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Rocket, Loader2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup, WatchlistItem } from "@/lib/server/db/schema";

export const Route = createFileRoute("/investor/portfolio")({
  component: PortfolioPage,
});

const sidebarItems = investorSidebar("portfolio");

type WatchlistEntry = { watchlist: WatchlistItem; startup: Startup };

function PortfolioPage() {
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

  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to load watchlist");
      return res.json() as Promise<WatchlistEntry[]>;
    },
    enabled,
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalSaved = watchlistData?.length ?? 0;

  return (
    <DashboardLayout items={sidebarItems} title="Portfolio">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm">Startups tracked</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalSaved}</p>
        </div>
      </div>

      {watchlistLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !watchlistData || watchlistData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">Your portfolio is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Save startups to your watchlist to start building your portfolio view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlistData.map(({ watchlist, startup }) => (
            <Link key={watchlist.id} to="/startups/$id" params={{ id: startup.id }} className="block">
              <div className="h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50">
                <div className="flex items-center gap-3">
                  {startup.logoUrl ? (
                    <img src={startup.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground">{startup.name}</h4>
                    <p className="text-xs text-muted-foreground">{startup.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{startup.industry}</Badge>
                  <Badge variant="secondary">{stageLabel(startup.stage)}</Badge>
                </div>
                {watchlist.notes && <p className="mt-3 text-xs text-muted-foreground">{watchlist.notes}</p>}
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
