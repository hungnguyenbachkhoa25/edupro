import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Clock } from "lucide-react";

export default function NotificationsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const updatePreference = async (key: string, value: any) => {
    try {
      await apiRequest("PATCH", "/api/settings/notifications", { [key]: value });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật tùy chọn thông báo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật tùy chọn thông báo.",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Thông báo</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý cách bạn nhận thông báo từ EduPro.
        </p>
      </div>

      <Tabs defaultValue="in-app" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="in-app" data-testid="tab-in-app">
            <Bell className="w-4 h-4 mr-2" />
            Trong app
          </TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-app" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông báo hệ thống</CardTitle>
              <CardDescription>
                Nhận thông báo trực tiếp trong ứng dụng về hoạt động của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nhắc lịch ôn tập</Label>
                  <p className="text-sm text-muted-foreground">Nhắc bạn khi đến giờ học đã hẹn.</p>
                </div>
                <Switch
                  checked={user.notifyDailyReminder ?? true}
                  onCheckedChange={(checked) => updatePreference("notifyDailyReminder", checked)}
                  data-testid="switch-notify-daily-reminder"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cảnh báo Streak</Label>
                  <p className="text-sm text-muted-foreground">Thông báo khi bạn sắp mất chuỗi học tập.</p>
                </div>
                <Switch
                  checked={user.notifyStreakWarning ?? true}
                  onCheckedChange={(checked) => updatePreference("notifyStreakWarning", checked)}
                  data-testid="switch-notify-streak-warning"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Giờ nhắc nhở
              </CardTitle>
              <CardDescription>
                Chọn thời gian bạn muốn nhận thông báo nhắc học mỗi ngày.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="time"
                  className="w-[150px]"
                  value={user.reminderTime || "20:00"}
                  onChange={(e) => updatePreference("reminderTime", e.target.value)}
                  data-testid="input-reminder-time"
                />
                <span className="text-sm text-muted-foreground">Giờ Việt Nam (GMT+7)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông báo qua Email</CardTitle>
              <CardDescription>
                Chúng tôi sẽ gửi các cập nhật quan trọng đến email của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Báo cáo học tập hàng tuần</Label>
                  <p className="text-sm text-muted-foreground">Tổng hợp tiến độ và kết quả học tập trong tuần.</p>
                </div>
                <Switch
                  checked={user.notifyEmailWeekly ?? true}
                  onCheckedChange={(checked) => updatePreference("notifyEmailWeekly", checked)}
                  data-testid="switch-notify-email-weekly"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
