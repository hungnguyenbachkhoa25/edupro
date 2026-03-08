import SettingsLayout from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, Trash2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edupro-data-${user?.username || 'user'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Đã xuất dữ liệu thành công" });
    } catch (error) {
      toast({ title: "Lỗi khi xuất dữ liệu", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Tài khoản</h3>
          <p className="text-sm text-muted-foreground">Quản lý dữ liệu và trạng thái tài khoản của bạn.</p>
        </div>

        <Card data-testid="card-data-export">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Dữ liệu cá nhân</CardTitle>
            </div>
            <CardDescription>
              Tải xuống tất cả kết quả thi, tiến độ học tập và thông tin cá nhân của bạn dưới định dạng JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleExportData} 
              disabled={isExporting}
              data-testid="button-export-data"
            >
              {isExporting ? "Đang xử lý..." : "Tải xuống dữ liệu (.json)"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50" data-testid="card-danger-zone">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-base">Khu vực nguy hiểm</CardTitle>
            </div>
            <CardDescription>
              Các hành động này không thể hoàn tác. Vui lòng cẩn trọng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h4 className="text-sm font-medium">Xóa tài khoản vĩnh viễn</h4>
              <p className="text-xs text-muted-foreground">
                Sau khi xóa, tài khoản của bạn sẽ bị vô hiệu hóa trong 30 ngày trước khi bị xóa vĩnh viễn khỏi hệ thống. 
                Bạn có thể đăng nhập lại trong thời gian này để hủy yêu cầu xóa.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-account">Xóa tài khoản</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bạn có chắc chắn muốn xóa tài khoản?</DialogTitle>
                  <DialogDescription className="space-y-3">
                    <p>Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu học tập và kết quả của bạn.</p>
                    <p className="font-semibold text-foreground">Vui lòng nhập email của bạn để xác nhận:</p>
                    <Input 
                      placeholder={user?.email || "Email của bạn"} 
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      data-testid="input-confirm-email"
                    />
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" data-testid="button-cancel-delete">Quay lại</Button>
                  <Button 
                    variant="destructive" 
                    disabled={confirmEmail !== user?.email}
                    data-testid="button-confirm-delete"
                  >
                    Xác nhận xóa vĩnh viễn
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </SettingsLayout>
  );
}
