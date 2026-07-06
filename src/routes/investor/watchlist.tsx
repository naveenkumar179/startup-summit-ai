import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Rocket, Loader2, Trash2, ArrowUpRight, StickyNote, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { Startup, WatchlistItem } from "@/lib/server/db/schema";

export const Route = createFileRoute("/investor/watchlist")({
  component: WatchlistPage,
});

const sidebarItems = investorSidebar("watchlist");

type WatchlistEntry = { watchlist: WatchlistItem; startup: Startup };

function WatchlistPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data, isLoading: listLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to load watchlist");
      return res.json() as Promise<WatchlistEntry[]>;
    },
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "investor",
  });

  const removeMutation = useMutation({
    mutationFn: async (startupId: string) => {
      const res = await fetch(`/api/watchlist/${startupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const notesMutation = useMutation({
    mutationFn: async ({ startupId, notes }: { startupId: string; notes: string }) => {
      const res = await fetch(`/api/watchlist/${startupId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      return startupId;
    },
    onSuccess: (startupId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setSavedId(startupId);
      setTimeout(() => setSavedId((current) => (current === startupId ? null : current)), 1500);
    },
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Watchlist">
      {listLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No saved startups yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Save startups from Discover to track and review them here.
          </p>
          <Link to="/investor/discover">
            <Button className="mt-4">Discover Startups</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ watchlist, startup }) => (
            <div key={watchlist.id} className="h-full rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {startup.logoUrl ? (
                    <img
                      src={startup.logoUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMutation.mutate(startup.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{startup.industry}</Badge>
                <Badge variant="secondary">{stageLabel(startup.stage)}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </div>
                <Textarea
                  value={drafts[startup.id] ?? watchlist.notes ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [startup.id]: e.target.value }))}
                  placeholder="Add private notes about this startup..."
                  className="min-h-16 text-sm"
                />
                <div className="flex items-center justify-end gap-2">
                  {savedId === startup.id && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Check className="h-3.5 w-3.5" /> Saved
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      notesMutation.isPending ||
                      (drafts[startup.id] ?? watchlist.notes ?? "") === (watchlist.notes ?? "")
                    }
                    onClick={() =>
                      notesMutation.mutate({
                        startupId: startup.id,
                        notes: drafts[startup.id] ?? watchlist.notes ?? "",
                      })
                    }
                  >
                    {notesMutation.isPending &&
                    notesMutation.variables?.startupId === startup.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Save note
                  </Button>
                </div>
              </div>
              <Link to="/startups/$id" params={{ id: startup.id }}>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  View details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
