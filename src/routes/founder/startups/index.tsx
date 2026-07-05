import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Rocket, Loader2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function MyStartupsPage() {
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

  return (
    <DashboardLayout items={sidebarItems} title="My Startups">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage your startup profiles and pitch decks.</p>
        <Link to="/founder/startups/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Startup
          </Button>
        </Link>
      </div>

      {startupsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !startups || startups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No startups yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first startup to unlock AI analysis and investor matching.
          </p>
          <Link to="/founder/startups/new">
            <Button className="mt-4">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Startup
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <Link key={s.id} to="/startups/$id" params={{ id: s.id }} className="block">
              <div className="h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50">
                <div className="flex items-start justify-between gap-2">
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
                  <Badge variant={s.status === "published" ? "default" : "outline"}>
                    {s.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{s.industry}</Badge>
                  <Badge variant="secondary">{stageLabel(s.stage)}</Badge>
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
