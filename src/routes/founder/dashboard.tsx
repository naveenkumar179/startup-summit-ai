import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import { PitchDeckUpload } from "@/components/pitch-deck/PitchDeckUpload";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/founder/dashboard")({
  component: FounderDashboard,
});

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/founder/dashboard", active: true },
  { label: "Pitch Deck", icon: FileText },
  { label: "AI Chat", icon: MessageSquare },
  { label: "Investors", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Profile Views", value: "0", icon: Eye, color: "text-primary", bg: "bg-accent" },
  { label: "Investor Matches", value: "0", icon: Users, color: "text-success", bg: "bg-success/10" },
  { label: "Pitch Score", value: "—", icon: TrendingUp, color: "text-warning", bg: "bg-warning/10" },
  { label: "Messages", value: "0", icon: MessageSquare, color: "text-primary", bg: "bg-accent" },
];

function FounderDashboard() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

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

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Founder Dashboard">
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload your pitch deck to get AI-powered analysis and start matching with investors.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PitchDeckUpload />

        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No investor matches yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Once your pitch deck is analyzed, we'll surface investors that fit your startup.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
