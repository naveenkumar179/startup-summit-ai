import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/startups/$id/improve")({
  component: ImprovePitchPage,
});

const sidebarItems = founderSidebar("startups");

function ImprovePitchPage() {
  const { id } = Route.useParams();
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

  const { data, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) throw new Error("Failed to load startup");
      return res.json() as Promise<{ startup: Startup }>;
    },
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "founder",
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/startups/${id}/improve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to generate suggestions");
      return body as Startup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups", id] });
    },
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder" || detailLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const suggestions = data.startup.improvementSuggestions ?? [];

  return (
    <DashboardLayout items={sidebarItems} title={`Improve Pitch — ${data.startup.name}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Get AI-powered suggestions to strengthen this pitch deck before sharing it with investors.
          </p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            {suggestions.length > 0 ? "Regenerate suggestions" : "Analyze my pitch deck"}
          </Button>
        </div>

        {generateMutation.error && (
          <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
        )}

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold text-foreground">No suggestions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run the analysis to get concrete gaps and suggestions for improving your pitch deck.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{s.area}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{s.issue}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.suggestion}</p>
                <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Example: </span>
                  {s.example}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
