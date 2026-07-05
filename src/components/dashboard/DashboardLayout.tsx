import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Search, Mail, ChevronDown } from "lucide-react";
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
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <BrandMark className="h-7 w-7" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            StartupBridge
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
                title="Coming soon"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            )
          )}
        </nav>

        <div className="border-t border-border p-3">
          <a
            href="/api/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </a>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <h1 className="hidden shrink-0 text-lg font-semibold text-foreground lg:block">{title}</h1>
            <div className="relative hidden max-w-sm flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search startups, investors, industries..."
                className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Mail className="h-4.5 w-4.5" />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
              )}
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user?.email}
                </div>
                {user?.role && (
                  <div className="text-xs capitalize text-muted-foreground">{user.role}</div>
                )}
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
