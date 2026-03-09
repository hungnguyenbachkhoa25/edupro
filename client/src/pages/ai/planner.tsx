import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AIFeaturesLayout from "./layout";

type StudyPlanResponse = {
  daysLeft: number;
  weeks: number;
  adaptiveRule: string;
  weeklyPlan: Array<{
    week: number;
    focusTopic: string;
    weeklyHours: number;
    objectives: string[];
    expectedScoreDelta: number;
  }>;
};

function toGoogleCalendarLink(title: string, details: string) {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const toDateTime = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${toDateTime(start)}/${toDateTime(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function AIPlannerPage() {
  const { toast } = useToast();
  const [examType, setExamType] = useState("IELTS");
  const [examDate, setExamDate] = useState("");
  const [currentScore, setCurrentScore] = useState("5.5");
  const [targetScore, setTargetScore] = useState("7.0");
  const [dailyHours, setDailyHours] = useState("2");
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const generatePlan = async () => {
    if (!examDate) {
      toast({ variant: "destructive", title: "Thiếu ngày thi", description: "Vui lòng chọn ngày thi." });
      return;
    }
    setIsPlanning(true);
    try {
      const res = await apiRequest("POST", "/api/ai/study-plan/generate", {
        examType,
        examDate,
        currentScore: Number(currentScore),
        targetScore: Number(targetScore),
        dailyHours: Number(dailyHours),
      });
      setStudyPlan((await res.json()) as StudyPlanResponse);
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể tạo lộ trình", description: (error as Error).message });
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <AIFeaturesLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Kế hoạch học tập</CardTitle>
            <CardDescription>Tạo lộ trình học chi tiết theo tuần và đồng bộ Google Calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kỳ thi</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IELTS">IELTS</SelectItem>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="THPTQG">THPTQG</SelectItem>
                    <SelectItem value="DGNL_HCM">DGNL HCM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày thi</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Điểm hiện tại</Label>
                <Input value={currentScore} onChange={(e) => setCurrentScore(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Điểm mục tiêu</Label>
                <Input value={targetScore} onChange={(e) => setTargetScore(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Giờ rảnh mỗi ngày</Label>
                <Input value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} />
              </div>
            </div>
            <Button onClick={generatePlan} disabled={isPlanning} data-testid="button-ai-generate-plan">
              {isPlanning ? "Đang tạo..." : "Tạo lộ trình học"}
            </Button>
          </CardContent>
        </Card>

        {studyPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Lộ trình {studyPlan.weeks} tuần</CardTitle>
              <CardDescription>Còn {studyPlan.daysLeft} ngày đến kỳ thi. {studyPlan.adaptiveRule}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {studyPlan.weeklyPlan.map((week) => (
                <div key={week.week} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">Tuần {week.week}: {week.focusTopic}</div>
                    <a href={toGoogleCalendarLink(`EduPro - Tuần ${week.week}`, week.objectives.join(" | "))} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1">
                        <CalendarPlus className="h-4 w-4" />
                        Thêm vào Google Calendar
                      </Button>
                    </a>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Khối lượng {week.weeklyHours}h/tuần • Tăng {week.expectedScoreDelta} điểm
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {week.objectives.map((obj) => <li key={obj}>{obj}</li>)}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AIFeaturesLayout>
  );
}
