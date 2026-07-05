import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2, ArrowUpRight, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FounderProfileSetup } from "@/components/profile/FounderProfileSetup";
import { stageLabel } from "@/lib/constants";
import type { InvestorMatch } from "@/lib/server/matching";

type MatchesResponse = { needsProfile: boolean; matches: InvestorMatch[] };

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

export function FounderMatchList() {
  const [setupOpen, setSetupOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["/api/matches"], queryFn: fetchMatches });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.needsProfile) {
    return (
      <>
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">Set up your startup profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about your company so we can match you with the right investors.
          </p>
          <button
            onClick={() => setSetupOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Set up profile
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <FounderProfileSetup open={setupOpen} onOpenChange={setSetupOpen} />
      </>
    );
  }

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold text-foreground">No investor matches yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As investors join and complete their profiles, matching investors will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-semibold text-foreground">Matched investors</h3>
      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.investor.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">
                    {m.profile.firmName ||
                      `${m.investor.firstName ?? "Investor"} ${m.investor.lastName ?? ""}`.trim()}
                  </h4>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.profile.industries.slice(0, 3).map((i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">
                      {i}
                    </Badge>
                  ))}
                  {m.profile.stagePreferences.slice(0, 2).map((s) => (
                    <Badge key={s} variant="outline" className="text-[11px]">
                      {stageLabel(s)}
                    </Badge>
                  ))}
                </div>
                {m.profile.bio && (
                  <p className="mt-2 text-xs text-muted-foreground">{m.profile.bio}</p>
                )}
              </div>
              <Badge variant={scoreBadgeVariant(m.score)} className="shrink-0 text-sm">
                {m.score}% match
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
