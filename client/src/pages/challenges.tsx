import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, CalendarDays, Swords, Sparkles } from "lucide-react";
import { useResults } from "@/hooks/use-results";
import { useGamification } from "@/hooks/use-gamification";

function secondsToClock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ChallengesPage() {
  const { data: results = [] } = useResults();
  const { streak } = useGamification();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dailyDone = useMemo(() => {
    const today = now.toISOString().slice(0, 10);
    return results.filter((r) => (r.completedAt ? new Date(r.completedAt).toISOString().slice(0, 10) === today : false)).length;
  }, [now, results]);

  const secondsToMidnight = useMemo(() => {
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  }, [now]);

  const isMorningBonus = now.getHours() < 8;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Daily & Weekly Challenges</h1>
          <p className="text-muted-foreground mt-2">Daily Challenge, Weekly Boss và Seasonal Event để giữ nhịp luyện thi.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Daily Challenge</CardTitle>
              <CardDescription>10 câu mỗi ngày, reset lúc 00:00.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">Đã làm hôm nay: <strong>{dailyDone}/10</strong></div>
              <div className="text-sm">Reset sau: <strong>{secondsToClock(secondsToMidnight)}</strong></div>
              <Badge variant={isMorningBonus ? "default" : "secondary"}>
                {isMorningBonus ? "Bonus XP x2 trước 8:00 sáng" : "Hết khung bonus sáng"}
              </Badge>
              <div>
                <Button className="mt-2" asChild>
                  <a href="/exams">Bắt đầu Daily Challenge</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /> Weekly Boss</CardTitle>
              <CardDescription>1 đề khó mỗi tuần, cùng toàn server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">Chủ đề tuần này: <strong>IELTS Reading - Inference</strong></p>
              <p className="text-sm text-muted-foreground">Thời hạn: Chủ nhật 23:59</p>
              <Button variant="outline">Vào Weekly Boss</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Seasonal Event</CardTitle>
              <CardDescription>Mùa thi THPTQG tháng 6: double XP + badge giới hạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className="bg-amber-500 text-black">Double XP Active</Badge>
              <p className="text-sm text-muted-foreground">Badge sự kiện sẽ khóa sau khi event kết thúc.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /> Streak & Freeze</CardTitle>
            <CardDescription>Nhắc nhở trước 2 tiếng và bảo vệ streak khi bận.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Streak hiện tại: <strong>{streak} ngày</strong></p>
            <p className="text-sm text-muted-foreground">Streak Freeze khả dụng: <strong>1</strong> (MVP UI)</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
