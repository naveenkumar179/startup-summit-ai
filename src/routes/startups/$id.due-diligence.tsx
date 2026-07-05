import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, Printer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id/due-diligence")({
  component: DueDiligencePage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 print:border-0 print:p-0 print:py-4">
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function DueDiligencePage() {
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
    }
  }, [isLoading, isAuthenticated, hasRole]);

  const { data, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) throw new Error("Failed to load startup");
      return res.json() as Promise<{ startup: Startup }>;
    },
    enabled: !isLoading && isAuthenticated && hasRole,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/startups/${id}/analyze`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to generate report");
      return body as Startup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups", id] });
    },
  });

  if (isLoading || !isAuthenticated || !hasRole || detailLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar("discover") : founderSidebar("startups");
  const analysis = data.startup.detailedAnalysis;

  return (
    <DashboardLayout items={sidebarItems} title={`Due Diligence — ${data.startup.name}`}>
      <div className="mx-auto max-w-4xl space-y-6" id="due-diligence-report">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">
            AI-generated investment due diligence report based on this startup's pitch deck.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {analysis ? "Regenerate report" : "Generate report"}
            </Button>
            {analysis && (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print / Export PDF
              </Button>
            )}
          </div>
        </div>

        {generateMutation.error && (
          <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
        )}

        {!analysis ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold text-foreground">No due diligence report yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate an AI-powered due diligence report covering SWOT, market opportunity, risks, and financials.
            </p>
          </div>
        ) : (
          <>
            <Section title="Investment Readiness Score">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-foreground">{analysis.investmentReadinessScore}</span>
                <Progress value={analysis.investmentReadinessScore} className="flex-1" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{analysis.recommendation}</p>
            </Section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Section title="Strengths">
                <BulletList items={analysis.swot.strengths} />
              </Section>
              <Section title="Weaknesses">
                <BulletList items={analysis.swot.weaknesses} />
              </Section>
              <Section title="Opportunities">
                <BulletList items={analysis.swot.opportunities} />
              </Section>
              <Section title="Threats">
                <BulletList items={analysis.swot.threats} />
              </Section>
            </div>

            <Section title="Business Model Analysis">
              <p className="text-sm text-muted-foreground">{analysis.businessModelAnalysis}</p>
            </Section>
            <Section title="Market Opportunity">
              <p className="text-sm text-muted-foreground">{analysis.marketOpportunity}</p>
            </Section>
            <Section title="Competitor Analysis">
              <p className="text-sm text-muted-foreground">{analysis.competitorAnalysis}</p>
            </Section>
            <Section title="Risk Analysis">
              <BulletList items={analysis.riskAnalysis} />
            </Section>
            <Section title="Financial Analysis">
              <p className="text-sm text-muted-foreground">{analysis.financialAnalysis}</p>
            </Section>
            <Section title="Growth Potential">
              <p className="text-sm text-muted-foreground">{analysis.growthPotential}</p>
            </Section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
