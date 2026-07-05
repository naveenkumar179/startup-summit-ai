import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { founderSidebar, investorSidebar } from "@/components/dashboard/sidebars";
import { ConversationView } from "@/components/messages/ConversationView";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/messages")({
  validateSearch: z.object({ with: z.string().optional() }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const { with: initialOtherUserId } = Route.useSearch();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (!hasRole) {
      navigate({ to: "/select-role" });
    }
  }, [isLoading, isAuthenticated, hasRole, navigate]);

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems =
    user?.role === "investor" ? investorSidebar("messages") : founderSidebar("messages");

  return (
    <DashboardLayout items={sidebarItems} title="Messages">
      <ConversationView initialOtherUserId={initialOtherUserId} />
    </DashboardLayout>
  );
}
