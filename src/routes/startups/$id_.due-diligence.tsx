import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { DetailedAnalysis, Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/startups/$id_/due-diligence")({
  component: DueDiligencePage,
});

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

type Section = {
  id: string;
  title: string;
  render: (analysis: DetailedAnalysis, startup: Startup) => React.ReactNode;
};

function buildSections(): Section[] {
  return [
    {
      id: "executive-summary",
      title: "Executive Summary",
      render: (a, s) => (
        <>
          <p className="text-sm text-muted-foreground">{a.recommendation}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-accent/40 p-3 text-center">
              <div className="text-lg font-bold text-foreground">
                {a.investmentReadinessScore}/100
              </div>
              <div className="text-xs text-muted-foreground">Investment Score</div>
            </div>
            <div className="rounded-xl bg-accent/40 p-3 text-center">
              <div className="text-lg font-bold text-success">
                {a.investmentReadinessScore >= 70
                  ? "High"
                  : a.investmentReadinessScore >= 45
                    ? "Medium"
                    : "Low"}
              </div>
              <div className="text-xs text-muted-foreground">Growth Potential</div>
            </div>
            <div className="rounded-xl bg-accent/40 p-3 text-center">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {a.riskAnalysis.length >= 4
                  ? "High"
                  : a.riskAnalysis.length >= 2
                    ? "Low-Medium"
                    : "Low"}
              </div>
              <div className="text-xs text-muted-foreground">Risk Level</div>
            </div>
            <div className="rounded-xl bg-accent/40 p-3 text-center">
              <div className="text-lg font-bold text-foreground">{s.fundingRequired ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Funding Ask</div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "company-overview",
      title: "Company Overview",
      render: (_a, s) => (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{s.description ?? "No description provided."}</p>
          <p>
            <span className="font-medium text-foreground">Industry: </span>
            {s.industry}
          </p>
          {s.location && (
            <p>
              <span className="font-medium text-foreground">Location: </span>
              {s.location}
            </p>
          )}
          {s.foundingYear && (
            <p>
              <span className="font-medium text-foreground">Founded: </span>
              {s.foundingYear}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "market-analysis",
      title: "Market Analysis",
      render: (a) => <p className="text-sm text-muted-foreground">{a.marketOpportunity}</p>,
    },
    {
      id: "product-technology",
      title: "Product & Technology",
      render: (_a, s) => (
        <p className="text-sm text-muted-foreground">
          {s.businessModel ?? "No product/technology details provided by the founder yet."}
        </p>
      ),
    },
    {
      id: "business-model",
      title: "Business Model",
      render: (a) => <p className="text-sm text-muted-foreground">{a.businessModelAnalysis}</p>,
    },
    {
      id: "financial-analysis",
      title: "Financial Analysis",
      render: (a) => <p className="text-sm text-muted-foreground">{a.financialAnalysis}</p>,
    },
    {
      id: "traction-growth",
      title: "Traction & Growth",
      render: (a) => <p className="text-sm text-muted-foreground">{a.growthPotential}</p>,
    },
    {
      id: "competitive-landscape",
      title: "Competitive Landscape",
      render: (a) => <p className="text-sm text-muted-foreground">{a.competitorAnalysis}</p>,
    },
    {
      id: "risks-concerns",
      title: "Risks & Concerns",
      render: (a) => <BulletList items={a.riskAnalysis} />,
    },
    {
      id: "investment-thesis",
      title: "Investment Thesis",
      render: (a) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success">
              Strengths
            </h4>
            <BulletList items={a.swot.strengths} />
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
              Weaknesses
            </h4>
            <BulletList items={a.swot.weaknesses} />
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Opportunities
            </h4>
            <BulletList items={a.swot.opportunities} />
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Threats
            </h4>
            <BulletList items={a.swot.threats} />
          </div>
        </div>
      ),
    },
    {
      id: "conclusion",
      title: "Conclusion",
      render: (a) => (
        <p className="text-sm text-muted-foreground">
          Based on an investment readiness score of {a.investmentReadinessScore}/100,{" "}
          {a.recommendation}
        </p>
      ),
    },
  ];
}

function DueDiligencePage() {
  const { id } = Route.useParams();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(0);
  const [downloading, setDownloading] = useState(false);

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
      setActiveSection(0);
      queryClient.invalidateQueries({ queryKey: ["/api/startups", id] });
    },
  });

  const sections = useMemo(() => buildSections(), []);

  async function handleDownloadPdf() {
    if (!data?.startup.detailedAnalysis) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const analysis = data.startup.detailedAnalysis;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - marginX * 2;
      let y = 56;

      function ensureSpace(lines: number) {
        const needed = lines * 14 + 20;
        if (y + needed > doc.internal.pageSize.getHeight() - 48) {
          doc.addPage();
          y = 56;
        }
      }

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`Due Diligence Report — ${data.startup.name}`, marginX, y);
      y += 26;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("AI-generated comprehensive investment analysis", marginX, y);
      doc.setTextColor(20);
      y += 24;

      for (const section of sections) {
        ensureSpace(2);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(section.title, marginX, y);
        y += 16;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        const text = sectionToPlainText(section.id, analysis, data.startup);
        for (const paragraph of text) {
          const lines = doc.splitTextToSize(paragraph, maxWidth);
          ensureSpace(lines.length);
          doc.text(lines, marginX, y);
          y += lines.length * 14 + 8;
        }
        y += 10;
      }

      doc.save(`${data.startup.name.replace(/\s+/g, "-").toLowerCase()}-due-diligence-report.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading || !isAuthenticated || !hasRole || detailLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sidebarItems =
    user?.role === "investor" ? investorSidebar("due-diligence") : founderSidebar("startups");
  const analysis = data.startup.detailedAnalysis;

  return (
    <DashboardLayout items={sidebarItems} title={`Due Diligence — ${data.startup.name}`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Due Diligence Report</h2>
            <p className="text-sm text-muted-foreground">
              AI-generated comprehensive report for {data.startup.name}
            </p>
            {analysis && (
              <p className="mt-1 text-xs text-muted-foreground">
                Generated by a 6-agent pipeline: Document, Risk, Research, Report Writer, Investment
                Advisor &amp; Supervisor agents
              </p>
            )}
          </div>
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
              <Button onClick={handleDownloadPdf} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Download PDF
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
              Generate an AI-powered due diligence report covering SWOT, market opportunity, risks,
              and financials.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
            <nav className="space-y-1 md:sticky md:top-4 md:self-start">
              {sections.map((section, i) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === i
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px]">
                    {i + 1}
                  </span>
                  {section.title}
                </button>
              ))}
            </nav>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-base font-semibold text-foreground">
                {activeSection + 1}. {sections[activeSection].title}
              </h3>
              {sections[activeSection].render(analysis, data.startup)}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function sectionToPlainText(id: string, a: DetailedAnalysis, s: Startup): string[] {
  switch (id) {
    case "executive-summary":
      return [
        a.recommendation,
        `Investment Score: ${a.investmentReadinessScore}/100  |  Funding Ask: ${s.fundingRequired ?? "N/A"}`,
      ];
    case "company-overview":
      return [
        s.description ?? "No description provided.",
        `Industry: ${s.industry}${s.location ? `  |  Location: ${s.location}` : ""}${
          s.foundingYear ? `  |  Founded: ${s.foundingYear}` : ""
        }`,
      ];
    case "market-analysis":
      return [a.marketOpportunity];
    case "product-technology":
      return [s.businessModel ?? "No product/technology details provided."];
    case "business-model":
      return [a.businessModelAnalysis];
    case "financial-analysis":
      return [a.financialAnalysis];
    case "traction-growth":
      return [a.growthPotential];
    case "competitive-landscape":
      return [a.competitorAnalysis];
    case "risks-concerns":
      return a.riskAnalysis.map((r) => `• ${r}`);
    case "investment-thesis":
      return [
        "Strengths:",
        ...a.swot.strengths.map((v) => `• ${v}`),
        "Weaknesses:",
        ...a.swot.weaknesses.map((v) => `• ${v}`),
        "Opportunities:",
        ...a.swot.opportunities.map((v) => `• ${v}`),
        "Threats:",
        ...a.swot.threats.map((v) => `• ${v}`),
      ];
    case "conclusion":
      return [
        `Based on an investment readiness score of ${a.investmentReadinessScore}/100, ${a.recommendation}`,
      ];
    default:
      return [];
  }
}
