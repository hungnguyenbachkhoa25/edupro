import { BookOpen, History, LayoutDashboard, LogOut, Flame, GraduationCap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kỳ thi", url: "/exams", icon: GraduationCap },
  { title: "Lịch sử luyện thi", url: "/history", icon: History },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            EduPro
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`rounded-xl transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover-elevate"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 py-2 px-3">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user?.firstName || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.plan || "Free"} Plan</span>
          </div>
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.firstName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="bg-accent rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Streak</span>
          </div>
          <span className="font-bold text-orange-500">{user?.streak || 0} days</span>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
