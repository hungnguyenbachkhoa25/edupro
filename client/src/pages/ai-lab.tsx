import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Sparkles, CalendarPlus, Bot, BrainCircuit, TrendingUp } from "lucide-react";

type WritingResponse = {
  scores: { tr: number; cc: number; lr: number; gra: number; overall: number };
  highlights: Array<{ type: "grammar" | "vocab-repeat" | "improvement"; snippet: string; message: string }>;
  sampleComparison: { band7: string; band8: string; currentGap: string };
  meta: { wordCount: number };
  scoredAt: string;
};

type StudyPlanResponse = {
  examType: string;
  examDate: string;
  daysLeft: number;
  weeks: number;
  adaptiveRule: string;
  weeklyPlan: Array<{
    week: number;
    intensity: string;
    focusTopic: string;
    weeklyHours: number;
    objectives: string[];
    expectedScoreDelta: number;
  }>;
};

type WeaknessResponse = {
  examType: string;
  basedOnAttempts: number;
  averageScore: number;
  weakTopics: Array<{ topic: string; subject: string; accuracy: number; needReview: boolean }>;
  recommendedExercises: Array<{ title: string; action: string }>;
  radar: Array<{ skill: string; score: number }>;
};

const HISTORY_KEY = "ai-writing-history-v1";

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

export default function AILabPage() {
  const { toast } = useToast();

  const [writingMode, setWritingMode] = useState("IELTS_TASK_2");
  const [essay, setEssay] = useState("");
  const [writingResult, setWritingResult] = useState<WritingResponse | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const [examType, setExamType] = useState("IELTS");
  const [examDate, setExamDate] = useState("");
  const [currentScore, setCurrentScore] = useState("5.5");
  const [targetScore, setTargetScore] = useState("7.0");
  const [dailyHours, setDailyHours] = useState("2");
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const [weakness, setWeakness] = useState<WeaknessResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const history = useMemo(() => {
    if (typeof window === "undefined") return [] as Array<{ date: string; overall: number }>;
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [] as Array<{ date: string; overall: number }>;
    try {
      return JSON.parse(raw) as Array<{ date: string; overall: number }>;
    } catch {
      return [];
    }
  }, [writingResult]);

  const scoreEssay = async () => {
    if (essay.trim().length < 60) {
      toast({ variant: "destructive", title: "Bài viết quá ngắn", description: "Vui lòng nhập ít nhất 60 ký tự." });
      return;
    }
    setIsScoring(true);
    try {
      const res = await apiRequest("POST", "/api/ai/writing/score", { mode: writingMode, essay });
      const data = (await res.json()) as WritingResponse;
      setWritingResult(data);
      const newHistory = [...history, { date: new Date().toLocaleDateString("vi-VN"), overall: data.scores.overall }].slice(-12);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      toast({ title: "Đã chấm bài", description: `Overall: ${data.scores.overall}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể chấm bài", description: (error as Error).message });
    } finally {
      setIsScoring(false);
    }
  };

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
      toast({ title: "Đã tạo lộ trình học", description: "Bạn có thể thêm từng tuần vào Google Calendar." });
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể tạo lộ trình", description: (error as Error).message });
    } finally {
      setIsPlanning(false);
    }
  };

  const analyzeWeakness = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/ai/weakness?examType=${examType}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      setWeakness((await res.json()) as WeaknessResponse);
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể phân tích", description: (error as Error).message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">AI Lab & Adaptive Learning</h1>
            <p className="text-sm text-muted-foreground">MVP cho phần 1/4: chấm writing, tạo study planner, phân tích điểm yếu.</p>
          </div>
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> Preview</Badge>
        </div>

        <Tabs defaultValue="writing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="writing">AI Writing</TabsTrigger>
            <TabsTrigger value="planner">AI Study Planner</TabsTrigger>
            <TabsTrigger value="weakness">AI Điểm yếu</TabsTrigger>
          </TabsList>

          <TabsContent value="writing" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>1.1 AI Chấm bài Writing</CardTitle>
                <CardDescription>Hỗ trợ IELTS Task 1/2 và THPTQG Văn theo rubric TR/CC/LR/GRA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Loại bài viết</Label>
                    <Select value={writingMode} onValueChange={setWritingMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IELTS_TASK_1">IELTS Writing Task 1</SelectItem>
                        <SelectItem value="IELTS_TASK_2">IELTS Writing Task 2</SelectItem>
                        <SelectItem value="THPTQG_VAN">THPTQG Văn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Dán bài viết vào đây để AI chấm..."
                  className="min-h-[180px]"
                />
                <Button onClick={scoreEssay} disabled={isScoring} data-testid="button-ai-score-writing">
                  {isScoring ? "Đang chấm..." : "Chấm bài"}
                </Button>
              </CardContent>
            </Card>

            {writingResult && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Band Score</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>TR: <strong>{writingResult.scores.tr.toFixed(1)}</strong></div>
                    <div>CC: <strong>{writingResult.scores.cc.toFixed(1)}</strong></div>
                    <div>LR: <strong>{writingResult.scores.lr.toFixed(1)}</strong></div>
                    <div>GRA: <strong>{writingResult.scores.gra.toFixed(1)}</strong></div>
                    <div className="text-base">Overall: <strong>{writingResult.scores.overall.toFixed(1)}</strong></div>
                    <div className="text-xs text-muted-foreground">Word count: {writingResult.meta.wordCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Lỗi & Gợi ý</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {writingResult.highlights.slice(0, 8).map((h, idx) => (
                      <div key={`${h.snippet}-${idx}`} className="rounded-md border p-2 text-sm">
                        <Badge
                          variant={h.type === "grammar" ? "destructive" : h.type === "vocab-repeat" ? "secondary" : "outline"}
                          className="mb-1"
                        >
                          {h.type === "grammar" ? "Đỏ: Ngữ pháp" : h.type === "vocab-repeat" ? "Vàng: Từ vựng lặp" : "Xanh: Cải thiện"}
                        </Badge>
                        <p className="font-medium">{h.snippet}</p>
                        <p className="text-muted-foreground">{h.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>So sánh Band 7.0 / 8.0</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Band 7.0:</strong> {writingResult.sampleComparison.band7}</p>
                    <p><strong>Band 8.0:</strong> {writingResult.sampleComparison.band8}</p>
                    <p><strong>Khoảng cách hiện tại:</strong> {writingResult.sampleComparison.currentGap}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Tiến bộ theo thời gian</CardTitle></CardHeader>
                  <CardContent className="h-[220px]">
                    {history.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <XAxis dataKey="date" />
                          <YAxis domain={[4, 9]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="overall" stroke="currentColor" className="stroke-primary" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử chấm bài.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="planner" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>1.2 AI Study Planner</CardTitle>
                <CardDescription>Tạo lộ trình theo tuần dựa trên ngày thi, điểm hiện tại, điểm mục tiêu và thời gian rảnh.</CardDescription>
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
                    <Label>Số giờ rảnh mỗi ngày</Label>
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
                  <CardDescription>Còn {studyPlan.daysLeft} ngày đến kỳ thi. Quy tắc adaptive: {studyPlan.adaptiveRule}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studyPlan.weeklyPlan.map((week) => (
                    <div key={week.week} className="rounded-lg border p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">Tuần {week.week}: {week.focusTopic}</div>
                        <a href={toGoogleCalendarLink(`EduPro - Tuần ${week.week} (${week.focusTopic})`, week.objectives.join(" | "))} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <CalendarPlus className="h-4 w-4" />
                            Thêm vào Google Calendar
                          </Button>
                        </a>
                      </div>
                      <div className="text-sm text-muted-foreground">Khối lượng: {week.weeklyHours}h/tuần • Mục tiêu tăng {week.expectedScoreDelta} điểm</div>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {week.objectives.map((obj) => <li key={obj}>{obj}</li>)}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weakness" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>1.3 AI Phân tích điểm yếu</CardTitle>
                <CardDescription>Tổng hợp sau mỗi lần luyện đề để gợi ý đúng phần cần ôn trước.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={analyzeWeakness} disabled={isAnalyzing} data-testid="button-ai-analyze-weakness">
                  {isAnalyzing ? "Đang phân tích..." : "Phân tích điểm yếu"}
                </Button>
                {weakness && (
                  <>
                    <div className="text-sm text-muted-foreground">Dựa trên {weakness.basedOnAttempts} đề gần nhất • Điểm TB: {weakness.averageScore}%</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle className="text-base">Radar Strength/Weakness</CardTitle></CardHeader>
                        <CardContent className="h-[260px]">
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

            <Card>
              <CardHeader>
                <CardTitle>Planned Next (1.4 den 2.3)</CardTitle>
                <CardDescription>Các module tiếp theo đã định nghĩa theo spec của bạn.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> AI Chatbot Giải bài (free/pro quota)</div>
                <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> AI Tạo đề cá nhân hóa + Daily Challenge</div>
                <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> Spaced Repetition (SM-2 + Anki import)</div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Adaptive Testing (SAT module + IRT)</div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Skill Tree unlock theo level</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
