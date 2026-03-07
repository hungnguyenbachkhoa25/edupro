import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, CheckCircle2, BookOpen, Trophy, User, Settings, Bell, Inbox } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Notification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "study":
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    case "achievement":
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case "account":
      return <User className="h-5 w-5 text-green-500" />;
    case "system":
      return <Settings className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { activeTab }],
    queryFn: async () => {
      const url = activeTab === "all" ? "/api/notifications" : `/api/notifications?type=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
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

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Đã xóa",
        description: "Thông báo đã được xóa thành công",
      });
    },
  });

  const filteredNotifications = notifications;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Thông báo</h1>
            <p className="text-muted-foreground mt-1">Cập nhật tin tức, tiến độ học tập và thành tích của bạn</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || notifications.length === 0}
            className="flex items-center gap-2"
            data-testid="button-mark-all-read-page"
          >
            <CheckCircle2 className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="bg-background/50 backdrop-blur-sm sticky top-0 z-10 pt-2 pb-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex h-auto p-1 gap-1">
              <TabsTrigger value="all" className="px-4 py-2 text-sm">Tất cả</TabsTrigger>
              <TabsTrigger value="study" className="px-4 py-2 text-sm">Học tập</TabsTrigger>
              <TabsTrigger value="achievement" className="px-4 py-2 text-sm">Thành tích</TabsTrigger>
              <TabsTrigger value="account" className="px-4 py-2 text-sm">Tài khoản</TabsTrigger>
              <TabsTrigger value="system" className="px-4 py-2 text-sm">Hệ thống</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <Inbox className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium text-lg">Hộp thư trống</p>
                    <p className="text-sm">Bạn không có thông báo nào trong mục này</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group flex items-start gap-4 p-6 transition-colors hover:bg-muted/30 relative ${
                          !notification.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                        data-testid={`notification-page-item-${notification.id}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <NotificationIcon type={notification.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`text-base leading-tight truncate ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                              {notification.title}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.createdAt || new Date()), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => markReadMutation.mutate(notification.id)}
                                data-testid={`button-mark-read-${notification.id}`}
                              >
                                Đánh dấu đã đọc
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate(notification.id)}
                              data-testid={`button-delete-notification-${notification.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
