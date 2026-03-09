import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, GraduationCap, Trophy, MessageCircle, Edit2, Calendar } from "lucide-react";
import { useResults } from "@/hooks/use-results";
import { useGamification } from "@/hooks/use-gamification";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { User } from "@shared/schema";

interface ProfilePageProps {
  username: string;
}

export default function ProfilePage({ username }: ProfilePageProps) {
  const { user: currentUser } = useAuth();
  const { data: results } = useResults();
  const { totalXp, level, levelTitle, badges } = useGamification();

  const isMe = username === "me" || username === currentUser?.username;

  const { data: profileUser, isLoading } = useQuery<User>({
    queryKey: [isMe ? "/api/profile/me" : `/api/profile/${username}`],
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profileUser) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Không tìm thấy người dùng</h2>
          <p className="text-muted-foreground mt-2">Người dùng này không tồn tại hoặc đã bị xóa.</p>
        </div>
      </DashboardLayout>
    );
  }

  const userResults = results || [];
  const totalTests = userResults.length;
  const streak = profileUser.streak || 0;
  const xp = totalXp;
  const rank = `${levelTitle} • Lv.${level}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-background rounded-2xl shadow-xl">
              <AvatarImage src={profileUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {profileUser.firstName?.charAt(0) || profileUser.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">
                  {profileUser.plan || "Free"}
                </Badge>
              </div>
              <p className="text-muted-foreground">@{profileUser.username || "user"}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              {isMe ? (
                <Button variant="outline" className="flex-1 sm:flex-none gap-2" asChild>
                  <a href="/settings/profile">
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </a>
                </Button>
              ) : (
                <Button className="flex-1 sm:flex-none gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Nhắn tin
                </Button>
              )}
            </div>
          </div>
          {profileUser.bio && (
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground max-w-2xl">{profileUser.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="font-bold">{streak} ngày</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <GraduationCap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng đề</p>
                <p className="font-bold">{totalTests}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP</p>
                <p className="font-bold">{xp}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-xl">
                <Calendar className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hạng</p>
                <p className="font-bold">{rank}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full sm:w-auto justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">Tổng quan</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-background">Kết quả</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-background">Thành tích</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hoạt động luyện tập</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 sm:grid-cols-13 gap-1">
                    {Array.from({ length: 91 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${
                          Math.random() > 0.7 
                            ? i % 3 === 0 ? "bg-primary" : "bg-primary/40"
                            : "bg-muted"
                        }`}
                        title={`Day ${i}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ít hơn</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-muted" />
                      <div className="w-3 h-3 rounded-sm bg-primary/20" />
                      <div className="w-3 h-3 rounded-sm bg-primary/40" />
                      <div className="w-3 h-3 rounded-sm bg-primary/60" />
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                    </div>
                    <span>Nhiều hơn</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hiệu suất theo chủ đề</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm italic">Biểu đồ đang được cập nhật...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {userResults.length > 0 ? (
              userResults.map((result) => (
                <Card key={result.id} className="hover-elevate">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{result.testId}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(result.completedAt || new Date()), "PPP", { locale: vi })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{Math.round((result.score / Math.max(1, result.totalQuestions)) * 100)}%</p>
                      <p className="text-xs text-muted-foreground">{result.totalQuestions} câu hỏi</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground">Chưa có kết quả thi nào</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <Card key={badge.id} className={`hover-elevate transition-opacity ${badge.unlocked ? "opacity-100" : "opacity-40"} ${badge.rare ? "ring-1 ring-amber-500/40" : ""}`}>
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`text-3xl ${badge.rare ? "animate-pulse" : ""}`}>{badge.icon}</div>
                  <p className="text-xs font-semibold leading-tight">{badge.title}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
