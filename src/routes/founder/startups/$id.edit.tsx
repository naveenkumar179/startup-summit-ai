import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { StartupForm } from "@/components/startups/StartupForm";
import { useAuth } from "@/hooks/use-auth";
import type { Startup } from "@/lib/server/db/schema";

export const Route = createFileRoute("/founder/startups/$id/edit")({
  component: EditStartupPage,
});

const sidebarItems = founderSidebar("startups");

function EditStartupPage() {
  const { id } = Route.useParams();
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

  const { data, isLoading: startupLoading } = useQuery({
    queryKey: ["/api/startups", id],
    queryFn: async () => {
      const res = await fetch(`/api/startups/${id}`);
      if (!res.ok) throw new Error("Failed to load startup");
      return res.json() as Promise<{ startup: Startup }>;
    },
    enabled: !isLoading && isAuthenticated && hasRole && user?.role === "founder",
  });

  if (isLoading || !isAuthenticated || !hasRole || user?.role !== "founder" || startupLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DashboardLayout items={sidebarItems} title="Edit Startup">
      <StartupForm startup={data.startup} />
    </DashboardLayout>
  );
}
