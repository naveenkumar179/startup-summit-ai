import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar } from "@/components/dashboard/sidebars";
import { StartupForm } from "@/components/startups/StartupForm";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/founder/startups/new")({
  component: NewStartupPage,
});

const sidebarItems = founderSidebar("startups");

function NewStartupPage() {
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
    <DashboardLayout items={sidebarItems} title="Add Startup">
      <StartupForm />
    </DashboardLayout>
  );
}
