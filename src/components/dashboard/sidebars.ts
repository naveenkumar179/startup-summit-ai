import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Search,
  BarChart3,
  Settings,
  Sparkles,
  Bookmark,
  ShieldCheck,
  Rocket,
  Briefcase,
  CalendarClock,
} from "lucide-react";
import type { SidebarItem } from "@/components/dashboard/DashboardLayout";

export function founderSidebar(active: string): SidebarItem[] {
  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/founder/dashboard",
      active: active === "dashboard",
    },
    { label: "My Startups", icon: Rocket, to: "/founder/startups", active: active === "startups" },
    {
      label: "Pitch Decks",
      icon: FileText,
      to: "/founder/pitch-decks",
      active: active === "pitch-deck",
    },
    {
      label: "Meetings",
      icon: CalendarClock,
      to: "/founder/meetings",
      active: active === "meetings",
    },
    { label: "Messages", icon: MessageSquare, to: "/messages", active: active === "messages" },
    { label: "Settings", icon: Settings, to: "/settings", active: active === "settings" },
  ];
}

export function investorSidebar(active: string): SidebarItem[] {
  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/investor/dashboard",
      active: active === "dashboard",
    },
    {
      label: "Discover Startups",
      icon: Search,
      to: "/investor/discover",
      active: active === "discover",
    },
    {
      label: "Watchlist",
      icon: Bookmark,
      to: "/investor/watchlist",
      active: active === "watchlist",
    },
    {
      label: "AI Due Diligence",
      icon: ShieldCheck,
      to: "/investor/due-diligence",
      active: active === "due-diligence",
    },
    {
      label: "Portfolio",
      icon: Briefcase,
      to: "/investor/portfolio",
      active: active === "portfolio",
    },
    {
      label: "Meetings",
      icon: CalendarClock,
      to: "/investor/meetings",
      active: active === "meetings",
    },
    { label: "Messages", icon: MessageSquare, to: "/messages", active: active === "messages" },
    { label: "Settings", icon: Settings, to: "/settings", active: active === "settings" },
  ];
}
