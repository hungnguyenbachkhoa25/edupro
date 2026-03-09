import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/use-gamification";

type RankItem = {
  rank: number;
  name: string;
  xp: number;
  scope: string;
  isMe?: boolean;
};

const MOCK_LEADERBOARD: RankItem[] = [
  { rank: 1, name: "Lan Anh", xp: 16540, scope: "Toàn quốc" },
  { rank: 2, name: "Minh Quân", xp: 15480, scope: "Toàn quốc" },
  { rank: 3, name: "Thảo Vy", xp: 14920, scope: "Toàn quốc" },
  { rank: 4, name: "Gia Hân", xp: 12600, scope: "Toàn quốc" },
  { rank: 5, name: "Tuấn Kiệt", xp: 11820, scope: "Toàn quốc" },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { totalXp } = useGamification();
  const [period, setPeriod] = useState("week");
  const [scope, setScope] = useState("nation");

  const list = useMemo(() => {
    const suffix = scope === "nation" ? "Toàn quốc" : scope === "province" ? "Tỉnh" : scope === "school" ? "Trường" : "Bạn bè";
    const base = MOCK_LEADERBOARD.map((item) => ({ ...item, scope: suffix }));
    const me: RankItem = {
      rank: 8,
      name: `${user?.firstName || "Bạn"} ${user?.lastName || ""}`.trim(),
      xp: totalXp,
      scope: suffix,
      isMe: true,
    };
    return [...base, me].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [scope, totalXp, user?.firstName, user?.lastName]);

  const top3 = list.slice(0, 3);
  const me = list.find((item) => item.isMe);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Xếp hạng theo tuần/tháng/all-time với bộ lọc khu vực.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Thời gian</p>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
                <SelectItem value="all">All-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Phạm vi</p>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nation">Toàn quốc</SelectItem>
                <SelectItem value="province">Tỉnh</SelectItem>
                <SelectItem value="school">Trường</SelectItem>
                <SelectItem value="friends">Bạn bè</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((item, idx) => (
            <Card key={item.rank} className={`relative overflow-hidden ${idx === 0 ? "ring-1 ring-yellow-400/60" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {idx === 0 ? <Crown className="h-5 w-5 text-yellow-500" /> : idx === 1 ? <Medal className="h-5 w-5 text-slate-400" /> : <Trophy className="h-5 w-5 text-amber-700" />}
                  Top {item.rank}
                </CardTitle>
                <CardDescription>Podium animation-ready card</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.xp.toLocaleString()} XP</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bảng xếp hạng</CardTitle>
            <CardDescription>{period === "week" ? "Tuần này" : period === "month" ? "Tháng này" : "Toàn thời gian"} • {scope}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((item) => (
              <div key={`${item.rank}-${item.name}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.isMe ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-7 text-sm font-semibold text-muted-foreground">#{item.rank}</span>
                  <span className="font-medium">{item.name}</span>
                  {item.isMe && <Badge variant="secondary">Bạn</Badge>}
                </div>
                <span className="text-sm font-semibold">{item.xp.toLocaleString()} XP</span>
              </div>
            ))}
            {me && me.rank > 10 && (
              <div className="pt-2 text-xs text-muted-foreground">
                Vị trí của bạn: #{me.rank} ({me.xp.toLocaleString()} XP)
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
