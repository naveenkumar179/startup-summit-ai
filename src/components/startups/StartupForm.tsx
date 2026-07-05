import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRY_OPTIONS, STAGE_OPTIONS } from "@/lib/constants";
import type { Startup } from "@/lib/server/db/schema";

type StartupFormValues = {
  name: string;
  tagline: string;
  industry: string;
  description: string;
  businessModel: string;
  stage: string;
  fundingRequired: string;
  location: string;
  website: string;
  foundingYear: string;
  teamSize: string;
  revenue: string;
  customers: string;
  logoUrl: string;
};

function fromStartup(startup?: Startup): StartupFormValues {
  return {
    name: startup?.name ?? "",
    tagline: startup?.tagline ?? "",
    industry: startup?.industry ?? "",
    description: startup?.description ?? "",
    businessModel: startup?.businessModel ?? "",
    stage: startup?.stage ?? "",
    fundingRequired: startup?.fundingRequired ?? "",
    location: startup?.location ?? "",
    website: startup?.website ?? "",
    foundingYear: startup?.foundingYear ?? "",
    teamSize: startup?.teamSize ?? "",
    revenue: startup?.revenue ?? "",
    customers: startup?.customers ?? "",
    logoUrl: startup?.logoUrl ?? "",
  };
}

export function StartupForm({ startup }: { startup?: Startup }) {
  const [values, setValues] = useState<StartupFormValues>(fromStartup(startup));
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = !!startup;

  function set<K extends keyof StartupFormValues>(key: K, value: StartupFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setError("Logo must be smaller than 800KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  const mutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      const payload = { ...values, status };
      const res = await fetch(isEdit ? `/api/startups/${startup!.id}` : "/api/startups", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to save startup");
      return data as Startup;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      navigate({ to: `/startups/${data.id}` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const canSubmit = values.name.trim() && values.industry.trim() && values.stage;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">Basics</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Startup name</Label>
            <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Acme Inc." />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={values.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="One sentence describing what you do"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={values.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={values.stage} onValueChange={(v) => set("stage", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What problem are you solving and how?"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="businessModel">Business model</Label>
            <Textarea
              id="businessModel"
              rows={3}
              value={values.businessModel}
              onChange={(e) => set("businessModel", e.target.value)}
              placeholder="How do you make money?"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fundingRequired">Funding required</Label>
            <Input id="fundingRequired" value={values.fundingRequired} onChange={(e) => set("fundingRequired", e.target.value)} placeholder="$500K" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="San Francisco, CA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://acme.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foundingYear">Founding year</Label>
            <Input id="foundingYear" value={values.foundingYear} onChange={(e) => set("foundingYear", e.target.value)} placeholder="2023" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teamSize">Team size</Label>
            <Input id="teamSize" value={values.teamSize} onChange={(e) => set("teamSize", e.target.value)} placeholder="8" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revenue">Revenue</Label>
            <Input id="revenue" value={values.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="$50K MRR" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="customers">Customers</Label>
            <Input id="customers" value={values.customers} onChange={(e) => set("customers", e.target.value)} placeholder="120 paying customers" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {values.logoUrl ? (
              <img src={values.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
            Upload logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelected} />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => {
            setError(null);
            mutation.mutate("draft");
          }}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
        </Button>
        <Button
          disabled={!canSubmit || mutation.isPending}
          onClick={() => {
            setError(null);
            mutation.mutate("published");
          }}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
        </Button>
      </div>
    </div>
  );
}
