import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { Brain, CalendarDays, ChartColumn, MessageSquareText, PenLine } from "lucide-react";

interface AIFeaturesLayoutProps {
  children: ReactNode;
}

const aiItems = [
  { title: "Chấm Writing AI", href: "/ai/writing", icon: PenLine },
  { title: "Kế hoạch học tập", href: "/ai/planner", icon: CalendarDays },
  { title: "Phân tích điểm yếu", href: "/ai/weakness", icon: ChartColumn },
  { title: "Trợ lý AI", href: "/ai/assistant", icon: MessageSquareText },
];

export default function AIFeaturesLayout({ children }: AIFeaturesLayoutProps) {
  const [location] = useLocation();

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tính năng AI</h1>
            <p className="text-sm text-muted-foreground">Học thông minh hơn với các công cụ AI chuyên biệt.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-xl border bg-card/40 p-3">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tính năng AI</div>
            <nav className="space-y-1">
              {aiItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-all",
                        isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </DashboardLayout>
  );
}
