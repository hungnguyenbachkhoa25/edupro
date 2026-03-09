import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft,
  ChevronRight,
  Home,
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
  const [location, navigate] = useLocation();
  const activeMenu = menuItems.find((item) => item.href === location);

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard">
            <a
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
              data-testid="button-back-dashboard"
            >
              <Home className="mr-2 h-4 w-4" />
              Về Dashboard
            </a>
          </Link>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            data-testid="button-settings-back"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Danh sách cài đặt
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground">
              Cài đặt
            </Link>
            {activeMenu && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{activeMenu.title}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside>
          <nav
            className="flex space-x-2 overflow-x-auto pb-2 lg:sticky lg:top-20 lg:flex-col lg:space-x-0 lg:space-y-1 lg:pb-0"
            data-testid="nav-settings"
          >
            {menuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "border-primary bg-primary/10 font-semibold text-primary"
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
          <div className="min-w-0 max-w-3xl" data-testid="container-settings-content">
            {children}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
