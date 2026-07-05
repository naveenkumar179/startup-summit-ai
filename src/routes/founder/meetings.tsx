import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Rocket, Loader2, Clock, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Meeting, Startup, User } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/meetings")({
  component: FounderMeetingsPage,
});

const sidebarItems = founderSidebar("meetings");

type MeetingEntry = { meeting: Meeting; startup: Startup; investor: User | null };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/10 text-primary border-primary/20",
};

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FounderMeetingsPage() {
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
    if (user?.role !== "founder") {
      navigate({ to: "/investor/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole, user]);

  const enabled = !isLoading && isAuthenticated && hasRole && user?.role === "founder";

  const { data, isLoading: listLoading } = useQuery({
    queryKey: ["/api/meetings"],
    queryFn: async () => {
      const res = await fetch("/api/meetings");
      if (!res.ok) throw new Error("Failed to load meetings");
      return res.json() as Promise<MeetingEntry[]>;
    },
    enabled,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmed" | "declined" }) => {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update meeting");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }),
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const pending = (data ?? []).filter((m) => m.meeting.status === "pending");
  const other = (data ?? []).filter((m) => m.meeting.status !== "pending");

  return (
    <DashboardLayout items={sidebarItems} title="Meetings">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-sm">Pending requests</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Confirmed</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {(data ?? []).filter((m) => m.meeting.status === "confirmed").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="h-4 w-4" />
            <span className="text-sm">Total requested</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{(data ?? []).length}</p>
        </div>
      </div>

      {listLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No meeting requests yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When an investor requests to connect with one of your startups, it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Awaiting your response</h3>
              <div className="space-y-3">
                {pending.map((entry) => (
                  <MeetingRow
                    key={entry.meeting.id}
                    entry={entry}
                    onConfirm={() => statusMutation.mutate({ id: entry.meeting.id, status: "confirmed" })}
                    onDecline={() => statusMutation.mutate({ id: entry.meeting.id, status: "declined" })}
                    isPending={statusMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">History</h3>
              <div className="space-y-3">
                {other.map((entry) => (
                  <MeetingRow key={entry.meeting.id} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function MeetingRow({
  entry,
  onConfirm,
  onDecline,
  isPending,
}: {
  entry: MeetingEntry;
  onConfirm?: () => void;
  onDecline?: () => void;
  isPending?: boolean;
}) {
  const { meeting, startup, investor } = entry;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {startup.logoUrl ? (
          <img src={startup.logoUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <Link to="/startups/$id" params={{ id: startup.id }} className="font-semibold text-foreground hover:underline">
              {startup.name}
            </Link>
            <Badge variant="outline" className={STATUS_STYLES[meeting.status]}>
              {meeting.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            with {investor?.firstName ? `${investor.firstName} ${investor.lastName ?? ""}` : investor?.email ?? "an investor"}
          </p>
          {meeting.agenda && <p className="mt-1 text-xs text-muted-foreground">{meeting.agenda}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatDateTime(meeting.scheduledAt)} &middot; {meeting.durationMinutes} min
        </div>
        {onConfirm && onDecline && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onDecline} disabled={isPending}>
              <X className="mr-1 h-3.5 w-3.5" />
              Decline
            </Button>
            <Button size="sm" onClick={onConfirm} disabled={isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
