import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Trophy, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ExamCardProps {
  id: string;
  title: string;
  category: string;
  duration: number;
  difficulty?: "Dễ" | "Trung bình" | "Khó";
  attempts?: number;
  href: string;
}

export function ExamCard({ 
  title, 
  category, 
  duration, 
  difficulty = "Trung bình", 
  attempts = 0,
  href 
}: ExamCardProps) {
  const difficultyColor = {
    "Dễ": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Trung bình": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Khó": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };

  return (
    <Card className="hover-elevate transition-all duration-300 border-border/50 overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className="font-medium">
            {category}
          </Badge>
          <Badge className={`no-default-hover-elevate ${difficultyColor[difficulty]}`}>
            {difficulty}
          </Badge>
        </div>
        <CardTitle className="text-lg font-display mt-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{duration} phút</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>{attempts} lượt thi</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild className="w-full group" variant="outline">
          <Link href={href} className="flex items-center justify-center gap-2">
            Luyện tập ngay
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
