import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Search, Bell, Mail, ChevronDown, Zap } from "lucide-react";
import { BrandMark } from "@/components/landing/BrandMark";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useAuth } from "@/hooks/use-auth";

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  active?: boolean;
};

export function DashboardLayout({
  items,
  title,
  children,
}: {
  items: SidebarItem[];
  title: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "U";
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email ?? "";

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BrandMark className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-none">
            <span className="text-sm font-bold tracking-tight text-foreground">StartupBridge</span>
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {user?.role ?? ""}
            </span>
          </div>
        </div>

        <div className="mx-4 mb-2 h-px bg-border/60" />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {items.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  item.active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 ${item.active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                />
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/40"
                title="Coming soon"
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-40" />
                {item.label}
                <span className="ml-auto rounded-full bg-border px-1.5 py-px text-[10px] text-muted-foreground/60">
                  Soon
                </span>
              </div>
            ),
          )}
        </nav>

        {/* Upgrade hint (cosmetic) */}
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">AI-Powered</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            All features powered by real-time AI analysis.
          </p>
        </div>

        {/* User + Logout */}
        <div className="border-t border-border p-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-foreground">{fullName}</div>
              <div className="truncate text-[11px] capitalize text-muted-foreground">
                {user?.role}
              </div>
            </div>
          </div>
          <a
            href="/api/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/90 px-6 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <h1 className="hidden shrink-0 text-base font-semibold text-foreground lg:block">
              {title}
            </h1>
            <div className="relative hidden max-w-xs flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search startups, investors…"
                className="h-8 w-full rounded-full border border-border bg-accent/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationBell />
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Mail className="h-4 w-4" />
            </button>
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <div className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-accent">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium text-foreground">{fullName || "User"}</div>
                <div className="text-[11px] capitalize text-muted-foreground">{user?.role}</div>
              </div>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
