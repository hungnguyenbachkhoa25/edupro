import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useResults } from "@/hooks/use-results";

const LEVEL_TITLES = [
  "Học sinh",
  "Sinh viên",
  "Chiến binh",
  "Học giả",
  "Bậc thầy",
  "Huyền thoại",
];

type BadgeItem = {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  rare?: boolean;
};

function xpNeededForLevel(level: number) {
  return 120 + (level - 1) * 70;
}

export function useGamification() {
  const { user } = useAuth();
  const { data: results = [] } = useResults();

  return useMemo(() => {
    const streak = user?.streak || 0;
    const correctXp = results.reduce((acc, r) => acc + r.score * 10, 0);
    const completionXp = results.length * 100;
    const streakXp = streak * 50;
    const totalXp = correctXp + completionXp + streakXp;

    let level = 1;
    let consumed = 0;
    while (level < 50) {
      const need = xpNeededForLevel(level);
      if (totalXp < consumed + need) break;
      consumed += need;
      level += 1;
    }
    const currentLevelXp = totalXp - consumed;
    const levelNeed = xpNeededForLevel(level);
    const levelProgress = Math.max(0, Math.min(100, Math.round((currentLevelXp / levelNeed) * 100)));
    const levelTier = Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 8));
    const levelTitle = LEVEL_TITLES[levelTier];

    const maxPercentage = results.length > 0
      ? Math.max(...results.map((r) => Math.round((r.score / Math.max(1, r.totalQuestions)) * 100)))
      : 0;

    const badges: BadgeItem[] = [
      { id: "streak-7", title: "Streak 7 ngày", icon: "🔥", unlocked: streak >= 7 },
      { id: "streak-30", title: "Streak 30 ngày", icon: "🔥", unlocked: streak >= 30 },
      { id: "streak-100", title: "Streak 100 ngày", icon: "🔥", unlocked: streak >= 100, rare: true },
      { id: "tests-10", title: "Hoàn thành 10 đề", icon: "📘", unlocked: results.length >= 10 },
      { id: "tests-50", title: "Hoàn thành 50 đề", icon: "📚", unlocked: results.length >= 50, rare: true },
      { id: "score-90", title: "Điểm 90%+", icon: "🎯", unlocked: maxPercentage >= 90 },
      { id: "score-100", title: "Perfect 100%", icon: "🏆", unlocked: maxPercentage >= 100, rare: true },
      { id: "social", title: "Xã hội", icon: "💬", unlocked: true },
      { id: "special", title: "Đặc biệt", icon: "✨", unlocked: level >= 20, rare: true },
    ];

    return {
      totalXp,
      streak,
      level,
      levelTitle,
      levelProgress,
      levelNeed,
      currentLevelXp,
      badges,
      stats: {
        totalTests: results.length,
        maxPercentage,
      },
    };
  }, [results, user?.streak]);
}
