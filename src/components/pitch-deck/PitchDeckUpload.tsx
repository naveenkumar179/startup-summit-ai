import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, ArrowUpRight, Loader2, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { PitchDeck } from "@/lib/server/db/schema";

async function fetchLatestDeck(): Promise<PitchDeck | null> {
  const res = await fetch("/api/pitch-deck");
  if (!res.ok) throw new Error("Failed to load pitch deck");
  return res.json();
}

export function PitchDeckUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: deck, isLoading } = useQuery({
    queryKey: ["/api/pitch-deck"],
    queryFn: fetchLatestDeck,
  });

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pitch-deck/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to analyze pitch deck");
      } else {
        queryClient.setQueryData(["/api/pitch-deck"], data);
      }
    } catch {
      setError("Something went wrong while uploading your pitch deck");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deck && deck.status === "analyzed" && deck.analysis) {
    const a = deck.analysis;
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{deck.fileName}</h3>
              <Badge variant="secondary">Analyzed</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <div className="text-2xl font-bold text-primary">{a.overallScore}</div>
            <div className="text-xs text-muted-foreground">Pitch Score</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {a.categories.map((c) => (
            <div key={c.name} className="rounded-lg border border-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className="text-sm text-muted-foreground">{c.score}/100</span>
              </div>
              <Progress value={c.score} className="mb-2 h-1.5" />
              <p className="text-xs text-muted-foreground">{c.feedback}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Strengths</h4>
            <ul className="space-y-1.5">
              {a.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Areas to improve</h4>
            <ul className="space-y-1.5">
              {a.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Suggested investor fit</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.suggestedInvestorTypes.map((t, i) => (
              <Badge key={i} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
          Upload a new version
        </button>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelected} />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      {isUploading ? (
        <>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h3 className="mt-3 font-semibold text-foreground">Analyzing your pitch deck…</h3>
          <p className="mt-1 text-sm text-muted-foreground">This usually takes about 20-30 seconds.</p>
        </>
      ) : (
        <>
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">
            {deck?.status === "failed" ? "Analysis failed" : "No pitch deck yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {deck?.status === "failed"
              ? deck.errorMessage ?? "Something went wrong. Please try uploading again."
              : "Upload your deck (PDF) to unlock AI analysis and investor matching."}
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Pitch Deck
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </>
      )}
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelected} />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
