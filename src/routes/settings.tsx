import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

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

  useEffect(() => {
    if (user && !initialized) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setInitialized(true);
    }
  }, [user, initialized]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...prev, ...data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar("settings") : founderSidebar("settings");

  return (
    <DashboardLayout items={sidebarItems} title="Settings">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Profile</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user?.role === "investor" ? "Investor" : "Founder"} disabled />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-success">Saved</span>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
