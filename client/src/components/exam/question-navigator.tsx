import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  flaggedQuestions: number[];
  onQuestionClick: (index: number) => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  flaggedQuestions,
  onQuestionClick,
}: QuestionNavigatorProps) {
  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-display">Tiến độ làm bài</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Đã làm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-border" />
            <span>Chưa làm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span>Đánh dấu</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-250px)] p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const isAnswered = answeredQuestions.includes(i);
              const isCurrent = currentQuestion === i;
              const isFlagged = flaggedQuestions.includes(i);

              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  data-testid={`button-question-${i + 1}`}
                  onClick={() => onQuestionClick(i)}
                  className={cn(
                    "w-full h-10 p-0 font-medium transition-all",
                    isCurrent && "ring-2 ring-primary ring-offset-2",
                    isAnswered && !isFlagged && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
                    isFlagged && "bg-orange-500 text-white border-orange-500 hover:bg-orange-600",
                    !isAnswered && !isFlagged && "hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {i + 1}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
