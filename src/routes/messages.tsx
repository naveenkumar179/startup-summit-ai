import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Search,
  ShieldCheck,
  Bookmark,
} from "lucide-react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import { ConversationView } from "@/components/messages/ConversationView";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/messages")({
  validateSearch: z.object({ with: z.string().optional() }),
  component: MessagesPage,
});

const founderSidebar: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/founder/dashboard" },
  { label: "Pitch Deck", icon: FileText },
  { label: "Messages", icon: MessageSquare, to: "/messages", active: true },
  { label: "Investors", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const investorSidebar: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/investor/dashboard" },
  { label: "Discover Startups", icon: Search },
  { label: "Due Diligence", icon: ShieldCheck },
  { label: "Saved Startups", icon: Bookmark },
  { label: "Messages", icon: MessageSquare, to: "/messages", active: true },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

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
  }, [isLoading, isAuthenticated, hasRole]);

  if (isLoading || !isAuthenticated || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sidebarItems = user?.role === "investor" ? investorSidebar : founderSidebar;

  return (
    <DashboardLayout items={sidebarItems} title="Messages">
      <ConversationView initialOtherUserId={initialOtherUserId} />
    </DashboardLayout>
  );
}
