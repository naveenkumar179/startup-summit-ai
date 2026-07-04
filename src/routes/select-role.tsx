import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Rocket, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { BrandMark } from "@/components/landing/BrandMark";

export const Route = createFileRoute("/select-role")({
  component: SelectRolePage,
});

function SelectRolePage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<"founder" | "investor" | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (hasRole) {
      navigate({ to: user!.role === "investor" ? "/investor/dashboard" : "/founder/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole]);

  async function chooseRole(role: "founder" | "investor") {
    setSubmitting(role);
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to set role");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate({ to: role === "investor" ? "/investor/dashboard" : "/founder/dashboard" });
    } catch (err) {
      console.error(err);
      setSubmitting(null);
    }
  }

  if (isLoading || !isAuthenticated || hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <BrandMark className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}. How will you use StartupBridge?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Choose your role to get a tailored experience. You can't change this later.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <button
            onClick={() => chooseRole("founder")}
            disabled={submitting !== null}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-left transition hover:border-primary/50 hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
              <Rocket className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">I'm a Founder</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your startup, get AI-powered pitch analysis, and connect with investors.
              </p>
            </div>
            {submitting === "founder" && (
              <span className="text-xs text-primary">Setting up your dashboard…</span>
            )}
          </button>

          <button
            onClick={() => chooseRole("investor")}
            disabled={submitting !== null}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-left transition hover:border-primary/50 hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
              <LineChart className="h-7 w-7 text-success" />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">I'm an Investor</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover vetted startups and use AI due diligence before you invest.
              </p>
            </div>
            {submitting === "investor" && (
              <span className="text-xs text-primary">Setting up your dashboard…</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
