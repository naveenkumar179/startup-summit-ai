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
  CalendarClock,
  Briefcase,
} from "lucide-react";
import type { SidebarItem } from "@/components/dashboard/DashboardLayout";

export function founderSidebar(active: string): SidebarItem[] {
  return [
    { label: "Dashboard", icon: LayoutDashboard, to: "/founder/dashboard", active: active === "dashboard" },
    { label: "My Startups", icon: Rocket, to: "/founder/startups", active: active === "startups" },
    { label: "Pitch Deck", icon: FileText, to: "/founder/dashboard", active: active === "pitch-deck" },
    { label: "Messages", icon: MessageSquare, to: "/messages", active: active === "messages" },
    { label: "Meetings", icon: CalendarClock, to: "/meetings", active: active === "meetings" },
    { label: "Settings", icon: Settings, to: "/settings", active: active === "settings" },
  ];
}

export function investorSidebar(active: string): SidebarItem[] {
  return [
    { label: "Dashboard", icon: LayoutDashboard, to: "/investor/dashboard", active: active === "dashboard" },
    { label: "Discover Startups", icon: Search, to: "/investor/discover", active: active === "discover" },
    { label: "Watchlist", icon: Bookmark, to: "/investor/watchlist", active: active === "watchlist" },
    { label: "Portfolio", icon: Briefcase, to: "/investor/portfolio", active: active === "portfolio" },
    { label: "Messages", icon: MessageSquare, to: "/messages", active: active === "messages" },
    { label: "Meetings", icon: CalendarClock, to: "/meetings", active: active === "meetings" },
    { label: "Settings", icon: Settings, to: "/settings", active: active === "settings" },
  ];
}
