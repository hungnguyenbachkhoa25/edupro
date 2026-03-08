import SettingsLayout from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Smartphone, History, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserSession, SecurityLog } from "@shared/schema";

export default function SecuritySettings() {
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery<UserSession[]>({
    queryKey: ["/api/settings/sessions"],
  });

  const { data: logs = [] } = useQuery<SecurityLog[]>({
    queryKey: ["/api/settings/security-logs"],
  });

  const logoutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await fetch(`/api/settings/sessions/${sessionId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/sessions"] });
      toast({ title: "Đã đăng xuất phiên làm việc" });
    },
  });

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Bảo mật</h3>
          <p className="text-sm text-muted-foreground">Quản lý mật khẩu và các phiên đăng nhập của bạn.</p>
        </div>

        <Card data-testid="card-replit-auth-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Mật khẩu & Xác thực</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary">
                Tài khoản của bạn được đăng nhập qua <strong>Replit</strong>. 
                Bảo mật và mật khẩu được quản lý trực tiếp bởi hệ thống của Replit.
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Xác thực 2 yếu tố (2FA)</div>
                <div className="text-xs text-muted-foreground">Thêm một lớp bảo mật cho tài khoản của bạn.</div>
              </div>
              <Badge variant="secondary" data-testid="status-2fa-coming-soon">Sắp ra mắt</Badge>
            </div>
          </CardContent>
        </Card>

        <div>
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Các phiên đăng nhập hoạt động
          </h4>
          <Card data-testid="card-sessions-list">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thiết bị / Trình duyệt</TableHead>
                  <TableHead>Địa chỉ IP</TableHead>
                  <TableHead>Hoạt động cuối</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{session.deviceName}</span>
                          <span className="text-xs text-muted-foreground">{session.browser}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{session.ipAddress}</TableCell>
                      <TableCell className="text-sm">
                        {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('vi-VN') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => logoutSessionMutation.mutate(session.id)}
                          disabled={logoutSessionMutation.isPending}
                          data-testid={`button-logout-session-${session.id}`}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Đăng xuất
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Đang tải danh sách phiên làm việc...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <History className="h-4 w-4" />
            Nhật ký bảo mật
          </h4>
          <Card data-testid="card-security-logs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sự kiện</TableHead>
                  <TableHead>Địa chỉ IP</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-security-log-${log.id}`}>
                      <TableCell className="text-sm font-medium">{log.eventType}</TableCell>
                      <TableCell className="text-sm">{log.ipAddress}</TableCell>
                      <TableCell className="text-sm">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Không có hoạt động bảo mật nào gần đây.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
