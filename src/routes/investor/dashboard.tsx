import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Search,
  Rocket,
  ShieldCheck,
  BarChart3,
  Settings,
  Sparkles,
  Bookmark,
  MessageSquare,
} from "lucide-react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/investor/dashboard")({
  component: InvestorDashboard,
});

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/investor/dashboard", active: true },
  { label: "Discover Startups", icon: Search },
  { label: "Due Diligence", icon: ShieldCheck },
  { label: "Saved Startups", icon: Bookmark },
  { label: "Messages", icon: MessageSquare },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Startups Reviewed", value: "0", icon: Rocket, color: "text-primary", bg: "bg-accent" },
  { label: "Saved Startups", value: "0", icon: Bookmark, color: "text-success", bg: "bg-success/10" },
  { label: "Due Diligence Reports", value: "0", icon: ShieldCheck, color: "text-warning", bg: "bg-warning/10" },
  { label: "Messages", value: "0", icon: MessageSquare, color: "text-primary", bg: "bg-accent" },
];

function InvestorDashboard() {
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
    if (user?.role !== "investor") {
      navigate({ to: "/founder/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole, user]);

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "investor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Investor Dashboard">
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
              Discover vetted startups and use AI-powered due diligence to make smarter decisions.
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

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold text-foreground">No startups to show yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As founders join and upload pitch decks, matching startups will appear here.
        </p>
      </div>
    </DashboardLayout>
  );
}
