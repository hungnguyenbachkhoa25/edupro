import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Target, 
  CreditCard, 
  UserCog 
} from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Thông tin cá nhân",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Bảo mật",
    href: "/settings/security",
    icon: ShieldCheck,
  },
  {
    title: "Thông báo",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Giao diện",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    title: "Mục tiêu",
    href: "/settings/goals",
    icon: Target,
  },
  {
    title: "Gói & Thanh toán",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Tài khoản",
    href: "/settings/account",
    icon: UserCog,
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-6">
        <aside className="lg:w-1/4">
          <nav
            className="flex space-x-2 overflow-x-auto pb-4 lg:flex-col lg:space-x-0 lg:space-y-1 lg:pb-0"
            data-testid="nav-settings"
          >
            {menuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    )}
                    data-testid={`link-settings-${item.href.split('/').pop()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{item.title}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl" data-testid="container-settings-content">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
