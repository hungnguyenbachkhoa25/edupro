import { BookOpen, History, LayoutDashboard, LogOut, Flame, GraduationCap, Settings, User, ChevronUp } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kỳ thi", url: "/exams", icon: GraduationCap },
  { title: "Lịch sử luyện thi", url: "/history", icon: History },
  { title: "Cài đặt", url: "/settings", icon: Settings },
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
        <div className="bg-accent rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Streak</span>
          </div>
          <span className="font-bold text-orange-500">{user?.streak || 0} days</span>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-between px-2 hover-elevate rounded-xl transition-all"
                  data-testid="button-user-menu"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-semibold truncate max-w-[120px]">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-primary/10 text-primary uppercase leading-none">
                        {user?.plan || "Free"}
                      </Badge>
                    </div>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
                align="start"
              >
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user?.username || "me"}`} className="flex items-center gap-2 cursor-pointer w-full">
                    <User className="h-4 w-4" />
                    <span>Xem hồ sơ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="flex items-center gap-2 cursor-pointer w-full">
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-destructive cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
