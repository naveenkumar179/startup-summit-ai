import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Rocket,
  Loader2,
  Globe,
  MapPin,
  Users,
  Calendar,
  CalendarClock,
  TrendingUp,
  Pencil,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { ScheduleMeetingDialog } from "@/components/meetings/ScheduleMeetingDialog";
import { useAuth } from "@/hooks/use-auth";
import { stageLabel } from "@/lib/constants";
import type { PitchDeck, Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id")({
  component: StartupDetailsPage,
});

type StartupDetailResponse = {
  startup: Startup;
  deck: PitchDeck | null;
  isOwner: boolean;
  isWatchlisted: boolean;
  match: { score: number; reasons: string[] } | null;
};

function StartupDetailsPage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);

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

  const { data, isLoading: detailLoading, error } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to load startup");
      }
      return res.json() as Promise<StartupDetailResponse>;
    },
    enabled: !isLoading && isAuthenticated && hasRole,
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (data?.isWatchlisted) {
        const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to update watchlist");
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ startupId: id }),
        });
        if (!res.ok) throw new Error("Failed to update watchlist");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar("discover") : founderSidebar("startups");

  return (
    <DashboardLayout items={sidebarItems} title="Startup Details">
      {detailLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error || !data ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Startup not found"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.startup.logoUrl ? (
                  <img src={data.startup.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                    <Rocket className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{data.startup.name}</h2>
                    {data.isOwner && (
                      <Badge variant={data.startup.status === "published" ? "default" : "outline"}>
                        {data.startup.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{data.startup.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{data.startup.industry}</Badge>
                    <Badge variant="secondary">{stageLabel(data.startup.stage)}</Badge>
                    {data.startup.fundingRequired && (
                      <Badge variant="secondary">Raising {data.startup.fundingRequired}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {data.startup.detailedAnalysis && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 px-4 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-success text-sm font-bold text-success">
                      {data.startup.detailedAnalysis.investmentReadinessScore}
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-medium text-foreground">Investment Readiness</div>
                      <div className="text-xs text-muted-foreground">out of 100</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                {data.isOwner ? (
                  <Link to="/founder/startups/$id/edit" params={{ id }}>
                    <Button variant="outline">
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                ) : user?.role === "investor" ? (
                  <>
                    <Button
                      variant={data.isWatchlisted ? "secondary" : "outline"}
                      onClick={() => watchlistMutation.mutate()}
                      disabled={watchlistMutation.isPending}
                    >
                      {data.isWatchlisted ? (
                        <BookmarkCheck className="mr-1.5 h-4 w-4" />
                      ) : (
                        <Bookmark className="mr-1.5 h-4 w-4" />
                      )}
                      {data.isWatchlisted ? "Saved" : "Save"}
                    </Button>
                    <Button onClick={() => setScheduleOpen(true)}>
                      <CalendarClock className="mr-1.5 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </>
                ) : null}
                {data.startup.pitchDeckId && (
                  <>
                    <Link to="/startups/$id/chat" params={{ id }}>
                      <Button variant="outline">
                        <MessageCircle className="mr-1.5 h-4 w-4" />
                        AI Chat
                      </Button>
                    </Link>
                    <Link to="/startups/$id/due-diligence" params={{ id }}>
                      <Button variant="outline">
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        Due Diligence
                      </Button>
                    </Link>
                    {data.isOwner && (
                      <Link to="/founder/startups/$id/improve" params={{ id }}>
                        <Button variant="outline">
                          <Sparkles className="mr-1.5 h-4 w-4" />
                          Improve Pitch
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {user?.role === "investor" && data.match && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1">
                <h3 className="mb-3 font-semibold text-foreground">AI Match Score</h3>
                <div className="flex flex-col items-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 - (data.match.score / 100) * (2 * Math.PI * 40)}
                        className="text-success"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-foreground">{data.match.score}%</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-success">
                    {data.match.score >= 80
                      ? "Excellent Match"
                      : data.match.score >= 55
                        ? "Good Match"
                        : "Limited Match"}
                  </p>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    This startup matches your investment preferences{" "}
                    {data.match.score >= 80 ? "very well" : data.match.score >= 55 ? "reasonably well" : "loosely"}.
                  </p>
                </div>
                <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top Reasons
                </h4>
                <ul className="space-y-1.5">
                  {data.match.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {data.startup.description && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-2 font-semibold text-foreground">About</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{data.startup.description}</p>
                </div>
              )}
              {data.startup.businessModel && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-2 font-semibold text-foreground">Business Model</h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{data.startup.businessModel}</p>
                </div>
              )}
              {!data.startup.pitchDeckId && data.isOwner && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Link a pitch deck to unlock AI chat, due diligence reports, and improvement suggestions for this startup.
                  </p>
                  <Link
                    to="/founder/startups/$id/edit"
                    params={{ id: data.startup.id }}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Link a pitch deck
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-3 font-semibold text-foreground">Details</h3>
                <div className="space-y-3 text-sm">
                  {data.startup.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {data.startup.location}
                    </div>
                  )}
                  {data.startup.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={data.startup.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {data.startup.website}
                      </a>
                    </div>
                  )}
                  {data.startup.foundingYear && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Founded {data.startup.foundingYear}
                    </div>
                  )}
                  {data.startup.teamSize && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> {data.startup.teamSize} team members
                    </div>
                  )}
                  {data.startup.revenue && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" /> {data.startup.revenue}
                    </div>
                  )}
                  {data.startup.customers && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> {data.startup.customers}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {data && user?.role === "investor" && (
        <ScheduleMeetingDialog
          startupId={data.startup.id}
          startupName={data.startup.name}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
        />
      )}
    </DashboardLayout>
  );
}
