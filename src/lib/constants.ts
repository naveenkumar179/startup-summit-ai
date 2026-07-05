export const INDUSTRY_OPTIONS = [
  "AI / Machine Learning",
  "B2B SaaS",
  "Fintech",
  "Healthtech",
  "Consumer",
  "Marketplace",
  "Developer Tools",
  "E-commerce",
  "Climate / Cleantech",
  "Edtech",
  "Biotech",
  "Other",
] as const;

export const STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b_plus", label: "Series B+" },
];

export function stageLabel(stage: string): string {
  return STAGE_OPTIONS.find((s) => s.value === stage)?.label ?? stage;
}
