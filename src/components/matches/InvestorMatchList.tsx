import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Rocket, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvestorProfileSetup } from "@/components/profile/InvestorProfileSetup";
import { stageLabel } from "@/lib/constants";
import type { FounderMatch } from "@/lib/server/matching";

type MatchesResponse = { needsProfile: boolean; matches: FounderMatch[] };

async function fetchMatches(): Promise<MatchesResponse> {
  const res = await fetch("/api/matches");
  if (!res.ok) throw new Error("Failed to load matches");
  return res.json();
}

function scoreBadgeVariant(score: number) {
  if (score >= 70) return "default" as const;
  if (score >= 40) return "secondary" as const;
  return "outline" as const;
}

export function InvestorMatchList() {
  const [setupOpen, setSetupOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["/api/matches"], queryFn: fetchMatches });

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.needsProfile) {
    return (
      <>
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">Set up your investor profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us which industries and stages you invest in to see AI-matched startups.
          </p>
          <button
            onClick={() => setSetupOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Set up profile
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <InvestorProfileSetup open={setupOpen} onOpenChange={setSetupOpen} />
      </>
    );
  }

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold text-foreground">No startups to show yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As founders join and complete their profiles, matching startups will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="font-semibold text-foreground">Matched startups</h3>
      {matches.map((m) => (
        <div key={m.founder.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{m.profile.companyName}</h4>
                <Badge variant="outline">{m.profile.industry}</Badge>
                <Badge variant="outline">{stageLabel(m.profile.stage)}</Badge>
              </div>
              {m.profile.fundingAsk && (
                <p className="mt-1 text-sm text-muted-foreground">Raising {m.profile.fundingAsk}</p>
              )}
              {m.deck?.status === "analyzed" && m.deck.analysis && (
                <p className="mt-2 text-sm text-muted-foreground">{m.deck.analysis.summary}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.reasons.map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <Badge variant={scoreBadgeVariant(m.score)} className="text-sm">
                {m.score}% match
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
