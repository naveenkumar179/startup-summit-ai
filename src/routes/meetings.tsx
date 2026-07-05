import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Meeting } from "@/lib/server/db/schema";

export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
});

function statusBadgeVariant(status: string) {
  if (status === "confirmed") return "default" as const;
  if (status === "cancelled") return "destructive" as const;
  if (status === "completed") return "secondary" as const;
  return "outline" as const;
}

function MeetingsPage() {
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
    }
  }, [isLoading, isAuthenticated, hasRole]);

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings"],
    queryFn: async () => {
      const res = await fetch("/api/meetings");
      if (!res.ok) throw new Error("Failed to load meetings");
      return res.json() as Promise<Meeting[]>;
    },
    enabled: !isLoading && isAuthenticated && hasRole,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update meeting");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }),
  });

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar("meetings") : founderSidebar("meetings");
  const isFounder = user?.role === "founder";

  return (
    <DashboardLayout items={sidebarItems} title="Meetings">
      {meetingsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No meetings scheduled</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFounder
              ? "Investors will be able to schedule meetings with you here."
              : "Schedule a meeting from a startup's details page."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{m.title}</h4>
                  <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(m.scheduledAt).toLocaleString()}
                </p>
                {m.notes && <p className="mt-1 text-sm text-muted-foreground">{m.notes}</p>}
              </div>
              {m.status === "scheduled" && (
                <div className="flex gap-2">
                  {isFounder && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: m.id, status: "confirmed" })}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: m.id, status: "cancelled" })}
                    disabled={updateMutation.isPending}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
