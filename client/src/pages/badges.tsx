import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGamification } from "@/hooks/use-gamification";

export default function BadgesPage() {
  const { badges, level, levelTitle, totalXp } = useGamification();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Huy hiệu</h1>
          <p className="text-muted-foreground mt-2">
            Bộ sưu tập thành tích cá nhân của bạn.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan</CardTitle>
            <CardDescription>
              Level {level} - {levelTitle} • {totalXp.toLocaleString()} XP
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">{badges.filter((b) => b.unlocked).length} đã mở</Badge>
            <Badge variant="outline">{badges.filter((b) => !b.unlocked).length} chưa mở</Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {badges.map((item) => (
            <Card
              key={item.id}
              className={`${item.unlocked ? "opacity-100" : "opacity-45"} ${item.rare ? "ring-1 ring-amber-500/40" : ""}`}
            >
              <CardContent className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 text-center">
                <div className={`text-3xl ${item.rare && item.unlocked ? "animate-pulse" : ""}`}>{item.icon}</div>
                <p className="text-xs font-semibold leading-tight">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
