import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CreditCard, Palette, ShieldCheck, Target, User, UserCog } from "lucide-react";

export default function SettingsIndex() {
  const items = [
    { title: "Thông tin cá nhân", href: "/settings/profile", icon: User },
    { title: "Bảo mật", href: "/settings/security", icon: ShieldCheck },
    { title: "Thông báo", href: "/settings/notifications", icon: Bell },
    { title: "Giao diện", href: "/settings/appearance", icon: Palette },
    { title: "Mục tiêu", href: "/settings/goals", icon: Target },
    { title: "Gói & Thanh toán", href: "/settings/billing", icon: CreditCard },
    { title: "Tài khoản", href: "/settings/account", icon: UserCog },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">Chọn mục bạn muốn cập nhật.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">Mở trang {item.title.toLowerCase()}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
