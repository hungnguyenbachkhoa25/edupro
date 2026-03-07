import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "../theme-toggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const style = {
    "--sidebar-width": "18rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full max-w-full overflow-hidden">
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover-elevate" />
              <h2 className="font-display font-semibold text-lg hidden sm:block">
                Learning Portal
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
