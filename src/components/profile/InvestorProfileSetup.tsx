import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { INDUSTRY_OPTIONS, STAGE_OPTIONS } from "@/lib/constants";

export function InvestorProfileSetup({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firmName, setFirmName] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [stagePreferences, setStagePreferences] = useState<string[]>([]);
  const [checkSizeMin, setCheckSizeMin] = useState("");
  const [checkSizeMax, setCheckSizeMax] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/investor/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firmName,
          industries,
          stagePreferences,
          checkSizeMin,
          checkSizeMax,
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to save profile");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/investor/profile"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Set up your investor profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="firmName">Firm name (optional)</Label>
            <Input
              id="firmName"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Acme Ventures"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Industries you invest in</Label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRY_OPTIONS.map((i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={industries.includes(i)}
                    onCheckedChange={() => toggle(industries, setIndustries, i)}
                  />
                  {i}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Stages you invest in</Label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_OPTIONS.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={stagePreferences.includes(s.value)}
                    onCheckedChange={() => toggle(stagePreferences, setStagePreferences, s.value)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkSizeMin">Min check size</Label>
              <Input
                id="checkSizeMin"
                value={checkSizeMin}
                onChange={(e) => setCheckSizeMin(e.target.value)}
                placeholder="$25K"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkSizeMax">Max check size</Label>
              <Input
                id="checkSizeMax"
                value={checkSizeMax}
                onChange={(e) => setCheckSizeMax(e.target.value)}
                placeholder="$250K"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What you look for in founders..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
            disabled={
              industries.length === 0 || stagePreferences.length === 0 || mutation.isPending
            }
          >
            {mutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
