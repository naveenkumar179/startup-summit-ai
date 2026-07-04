import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Check, AlertTriangle } from "lucide-react";
import { ScoreRing } from "./ScoreRing";

const radarData = [
  { axis: "Market Potential", value: 85 },
  { axis: "Team", value: 78 },
  { axis: "Business Model", value: 72 },
  { axis: "Traction", value: 58 },
  { axis: "Innovation", value: 88 },
];

const strengths = [
  "Strong market opportunity",
  "Clear revenue model",
  "Experienced team",
];

const risks = [
  "Limited traction",
  "High competition",
  "Funding amount high",
];

export function HeroPreviewCard() {
  return (
    <div className="rounded-3xl bg-card border border-border/70 p-6 shadow-[var(--shadow-elevated)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">AI Analysis Overview</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="oklch(0.9 0.01 275)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 270)" }}
                />
                <Radar
                  dataKey="value"
                  stroke="oklch(0.56 0.22 285)"
                  fill="oklch(0.56 0.22 285)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">
            Investment Readiness Score
          </h3>
          <ScoreRing score={78} />
          <p className="mt-3 text-sm font-medium text-foreground">High Potential</p>
          <p className="text-xs text-muted-foreground text-center mt-1 max-w-[180px]">
            Well structured startup with strong fundamentals
          </p>
        </div>
      </div>

      {/* Strengths & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/60">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Strengths</h4>
          <ul className="space-y-2">
            {strengths.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Risks</h4>
          <ul className="space-y-2">
            {risks.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
