import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";

export function XPBar() {
  const { level, levelTitle, levelProgress, currentLevelXp, levelNeed } = useGamification();

  return (
    <div className="hidden min-w-[230px] rounded-xl border border-border/60 bg-card/70 px-3 py-2 md:block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Badge variant="secondary" className="h-5 px-2 text-[10px] uppercase tracking-wide">
          Lv.{level} - {levelTitle}
        </Badge>
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          XP
        </span>
      </div>
      <Progress value={levelProgress} className="h-1.5" />
      <p className="mt-1 text-[11px] text-muted-foreground">
        {currentLevelXp}/{levelNeed} XP đến level tiếp theo
      </p>
    </div>
  );
}
