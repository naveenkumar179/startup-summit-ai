import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, CheckCircle2, XCircle, Clock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";
import type { PitchDeck } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/pitch-decks")({
  component: PitchDecksPage,
});

const sidebarItems = founderSidebar("pitch-deck");

async function fetchDecks(): Promise<PitchDeck[]> {
  const res = await fetch("/api/pitch-deck/list");
  if (!res.ok) throw new Error("Failed to load pitch decks");
  return res.json();
}

const STATUS_META: Record<
  PitchDeck["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  analyzed: { label: "Analyzed", icon: CheckCircle2, className: "bg-success/10 text-success" },
  processing: { label: "Processing", icon: Clock, className: "bg-warning/10 text-warning" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

function PitchDecksPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const { data: decks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/pitch-deck/list"],
    queryFn: fetchDecks,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "processing") ? 3000 : false,
  });

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pitch-deck/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to analyze pitch deck");
      } else {
        queryClient.setQueryData(["/api/pitch-deck"], data);
        queryClient.invalidateQueries({ queryKey: ["/api/pitch-deck/list"] });
      }
    } catch {
      setError("Something went wrong while uploading your pitch deck");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Pitch Decks">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Upload and review the pitch decks you've submitted for AI analysis.
        </p>
        <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-1.5 h-4 w-4" />
          )}
          Upload Pitch Deck
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {decksLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !decks || decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No pitch decks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your deck (PDF) to unlock AI analysis and investor matching.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => {
            const meta = STATUS_META[deck.status];
            const isExpanded = expandedId === deck.id;
            return (
              <div key={deck.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-medium text-foreground">{deck.fileName}</h4>
                      <p className="text-xs text-muted-foreground">
                        Uploaded{" "}
                        {deck.createdAt ? new Date(deck.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {deck.status === "analyzed" && deck.analysis && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {deck.analysis.overallScore}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Score</div>
                      </div>
                    )}
                    <Badge className={`gap-1 ${meta.className}`} variant="secondary">
                      <meta.icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                    {deck.status === "analyzed" && deck.analysis && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : deck.id)}
                        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        {isExpanded ? "Hide" : "Details"}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {deck.status === "failed" && (
                  <p className="mt-3 text-sm text-destructive">
                    {deck.errorMessage ?? "Something went wrong while analyzing this deck."}
                  </p>
                )}

                {isExpanded && deck.analysis && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">{deck.analysis.summary}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {deck.analysis.categories.map((c) => (
                        <div key={c.name} className="rounded-lg border border-border p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            <span className="text-sm text-muted-foreground">{c.score}/100</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
