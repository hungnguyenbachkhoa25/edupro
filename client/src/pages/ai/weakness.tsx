import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import AIFeaturesLayout from "./layout";

type WeaknessResponse = {
  basedOnAttempts: number;
  averageScore: number;
  recommendedExercises: Array<{ title: string; action: string }>;
  radar: Array<{ skill: string; score: number }>;
};

export default function AIWeaknessPage() {
  const { toast } = useToast();
  const [weakness, setWeakness] = useState<WeaknessResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWeakness = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/weakness?examType=IELTS", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      setWeakness((await res.json()) as WeaknessResponse);
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể phân tích", description: (error as Error).message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AIFeaturesLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Phân tích điểm yếu</CardTitle>
            <CardDescription>AI tổng hợp dạng bài sai nhiều và gợi ý bài tập mục tiêu cho bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={analyzeWeakness} disabled={isAnalyzing} data-testid="button-ai-analyze-weakness">
              {isAnalyzing ? "Đang phân tích..." : "Phân tích điểm yếu"}
            </Button>

            {weakness && (
              <>
                <div className="text-sm text-muted-foreground">
                  Dựa trên {weakness.basedOnAttempts} đề gần nhất • Điểm TB: {weakness.averageScore}%
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Radar điểm mạnh/yếu</CardTitle></CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={weakness.radar}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                          <Radar dataKey="score" stroke="currentColor" fill="currentColor" className="fill-primary/25 stroke-primary" />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Gợi ý bài tập mục tiêu</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {weakness.recommendedExercises.map((item) => (
                        <div key={item.title} className="rounded-md border p-2">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-muted-foreground">{item.action}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AIFeaturesLayout>
  );
}
