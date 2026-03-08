import SettingsLayout from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Check, ArrowUpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const mockTransactions = [
  { id: "TX1001", plan: "Pro (1 tháng)", date: "2024-02-01", amount: "99.000đ", status: "Hoàn tất" },
  { id: "TX1002", plan: "Premium (1 năm)", date: "2024-03-01", amount: "1.990.000đ", status: "Hoàn tất" },
];

const tiers = [
  {
    name: "Free",
    price: "0đ",
    features: ["Truy cập 50% kho đề", "Thống kê cơ bản", "Hỗ trợ cộng đồng"],
    current: true,
  },
  {
    name: "Pro",
    price: "99.000đ/tháng",
    features: ["Truy cập 100% kho đề", "Thống kê chi tiết", "Giải thích đáp án AI", "Không quảng cáo"],
    current: false,
  },
  {
    name: "Premium",
    price: "199.000đ/tháng",
    features: ["Tất cả tính năng Pro", "Lộ trình học cá nhân hóa", "Gia sư hỗ trợ 24/7", "Tải tài liệu PDF"],
    current: false,
  },
];

export default function BillingSettings() {
  const { user } = useAuth();
  const currentPlan = user?.plan || "free";

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Gói & Thanh toán</h3>
          <p className="text-sm text-muted-foreground">Quản lý gói đăng ký và lịch sử giao dịch của bạn.</p>
        </div>

        <Card data-testid="card-current-plan">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gói hiện tại</CardTitle>
                <CardDescription>Bạn đang sử dụng gói {currentPlan.toUpperCase()}</CardDescription>
              </div>
              <Badge variant={currentPlan === "free" ? "secondary" : "default"}>
                {currentPlan === "free" ? "Cơ bản" : "Trả phí"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Ngày bắt đầu: </span>
              <span className="font-medium">01/01/2024 (Mock)</span>
            </div>
            {currentPlan === "free" ? (
              <Button className="w-full sm:w-auto" data-testid="button-upgrade">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Nâng cấp ngay
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto" data-testid="button-renew">Gia hạn</Button>
                <Button variant="ghost" className="text-destructive w-full sm:w-auto" data-testid="button-cancel-subscription">Hủy đăng ký</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <Card key={tier.name} className={cn("flex flex-col", tier.name.toLowerCase() === currentPlan && "border-primary")} data-testid={`card-tier-${tier.name}`}>
              <CardHeader>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="text-2xl font-bold">{tier.price}</div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button 
                  variant={tier.name.toLowerCase() === currentPlan ? "outline" : "default"} 
                  className="w-full"
                  disabled={tier.name.toLowerCase() === currentPlan}
                  data-testid={`button-select-tier-${tier.name}`}
                >
                  {tier.name.toLowerCase() === currentPlan ? "Đang sử dụng" : "Chọn gói"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4">Lịch sử giao dịch</h4>
          <Table data-testid="table-transactions">
            <TableHeader>
              <TableRow>
                <TableHead>Mã GD</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx) => (
                <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                  <TableCell className="font-medium">{tx.id}</TableCell>
                  <TableCell>{tx.plan}</TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="pt-4 border-t">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground p-0 h-auto hover:bg-transparent" data-testid="button-cancel-service">
                Hủy đăng ký dịch vụ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận hủy đăng ký</DialogTitle>
                <DialogDescription>
                  Bạn sẽ mất quyền truy cập vào các tính năng Premium vào cuối chu kỳ thanh toán hiện tại. 
                  Bạn có chắc chắn muốn tiếp tục?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" data-testid="button-confirm-cancel-no">Giữ lại gói</Button>
                <Button variant="destructive" data-testid="button-confirm-cancel-yes">Xác nhận hủy</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SettingsLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
