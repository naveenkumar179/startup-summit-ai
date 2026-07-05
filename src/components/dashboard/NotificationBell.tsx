import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarClock, CalendarCheck, CalendarX, MessageSquare, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/server/db/schema";

const ICONS: Record<Notification["type"], typeof Bell> = {
  meeting_requested: CalendarClock,
  meeting_confirmed: CalendarCheck,
  meeting_declined: CalendarX,
  meeting_cancelled: CalendarX,
  message_received: MessageSquare,
};

function timeAgo(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json() as Promise<{ items: Notification[]; unreadCount: number }>;
    },
    refetchInterval: 30000,
  });

  const unreadCount = data?.unreadCount ?? 0;

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            data.items.map((notification) => {
              const Icon = ICONS[notification.type] ?? Bell;
              const content = (
                <div
                  className={`flex gap-3 border-b border-border px-4 py-3 last:border-0 ${
                    !notification.isRead ? "bg-accent/40" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    {notification.body && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{notification.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {timeAgo(notification.createdAt ?? new Date())}
                    </p>
                  </div>
                  {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );

              return notification.link ? (
                <Link
                  key={notification.id}
                  to={notification.link}
                  onClick={() => !notification.isRead && markOneRead(notification.id)}
                  className="block hover:bg-accent/60"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markOneRead(notification.id)}
                  className="cursor-pointer hover:bg-accent/60"
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
