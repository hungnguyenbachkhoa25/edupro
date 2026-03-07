import { useState, useEffect } from "react";
import { Bell, BookOpen, Trophy, User, Settings, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSocket } from "@/hooks/use-socket";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Notification } from "@shared/schema";

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "study":
      return <BookOpen className="h-4 w-4 text-blue-500" />;
    case "achievement":
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case "account":
      return <User className="h-4 w-4 text-green-500" />;
    case "system":
      return <Settings className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    if (socket) {
      const handleNewNotification = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      };

      socket.on("notification:new", handleNewNotification);
      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [socket]);

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-elevate"
          data-testid="button-notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-[10px]"
              data-testid="status-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto p-0 hover:bg-transparent text-primary"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer relative ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markReadMutation.mutate(notification.id);
                  }}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="mt-1">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm leading-none ${!notification.isRead ? "font-semibold" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt || new Date()), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setOpen(false)}
              data-testid="link-view-all-notifications"
            >
              Xem tất cả
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
