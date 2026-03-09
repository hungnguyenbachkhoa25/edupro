import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Download, FileText, Pause, Play, Timer, Video } from "lucide-react";

type FormulaItem = {
  id: string;
  topic: string;
  title: string;
  latex: string;
};

const formulas: FormulaItem[] = [
  { id: "f1", topic: "Toán", title: "Công thức nghiệm bậc hai", latex: "x = (-b ± sqrt(b^2 - 4ac)) / (2a)" },
  { id: "f2", topic: "Vật lý", title: "Định luật II Newton", latex: "F = m * a" },
  { id: "f3", topic: "Hóa học", title: "Nồng độ mol", latex: "C_M = n / V" },
  { id: "f4", topic: "IELTS", title: "Cấu trúc câu điều kiện", latex: "If + S + V2/ed, S + would + V" },
];

const transcript = [
  { t: 0, text: "Giới thiệu chủ đề và mục tiêu bài học." },
  { t: 40, text: "Phân tích dạng bài thường gặp và lỗi phổ biến." },
  { t: 95, text: "Chiến lược làm bài trong 5 bước." },
  { t: 165, text: "Ví dụ minh họa thực tế." },
  { t: 230, text: "Tổng kết và bài tập về nhà." },
];

type MindNode = {
  id: string;
  label: string;
  children: string[];
};

const baseMindNodes: MindNode[] = [
  { id: "m1", label: "Toán THPTQG", children: ["Số học", "Đại số", "Hàm số"] },
  { id: "m2", label: "Đại số", children: ["PT bậc hai", "BĐT", "Hệ phương trình"] },
  { id: "m3", label: "Hàm số", children: ["Đạo hàm", "Cực trị", "Tiệm cận"] },
];

const POMODORO_KEY = "pomodoro-focus-log-v1";

export default function LearningCenterPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPremium = user?.plan === "pro" || user?.plan === "premium";
  const videoRef = useRef<HTMLVideoElement>(null);

  const [speed, setSpeed] = useState(1);
  const [videoNotes, setVideoNotes] = useState<Array<{ at: number; note: string }>>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [search, setSearch] = useState("");
  const [vocabAnswer, setVocabAnswer] = useState("");
  const [vocabResult, setVocabResult] = useState<"correct" | "wrong" | null>(null);

  const [mindNodes, setMindNodes] = useState<MindNode[]>(baseMindNodes);
  const [mindRoot, setMindRoot] = useState("Toán THPTQG");
  const [mindChildren, setMindChildren] = useState("Giới hạn, Tích phân");

  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [focusTodayMin, setFocusTodayMin] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            const nextValue = 5 * 60;
            setIsBreak(true);
            setFocusTodayMin((minutes) => {
              const updated = minutes + 25;
              const today = new Date().toISOString().slice(0, 10);
              const raw = localStorage.getItem(POMODORO_KEY);
              const map: Record<string, number> = raw ? JSON.parse(raw) : {};
              map[today] = (map[today] || 0) + 25;
              localStorage.setItem(POMODORO_KEY, JSON.stringify(map));
              return updated;
            });
            toast({ title: "Hoàn thành 1 Pomodoro", description: "Nghỉ 5 phút nào!" });
            return nextValue;
          }
          setIsBreak(false);
          toast({ title: "Kết thúc giờ nghỉ", description: "Bắt đầu chu kỳ học mới." });
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isBreak, toast]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(POMODORO_KEY);
    if (!raw) return;
    try {
      const map: Record<string, number> = JSON.parse(raw);
      setFocusTodayMin(map[today] || 0);
    } catch (_error) {
      // ignore
    }
  }, []);

  const filteredFormulas = formulas.filter(
    (item) => item.title.toLowerCase().includes(search.toLowerCase()) || item.topic.toLowerCase().includes(search.toLowerCase()),
  );

  const pomodoroStats = useMemo(() => {
    const raw = localStorage.getItem(POMODORO_KEY);
    let map: Record<string, number> = {};
    try {
      map = raw ? JSON.parse(raw) : {};
    } catch (_error) {
      map = {};
    }
    const now = new Date();
    let week = 0;
    let month = 0;
    Object.entries(map).forEach(([date, min]) => {
      const d = new Date(date);
      const diffDay = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDay <= 7) week += min;
      if (diffDay <= 30) month += min;
    });
    return { week, month };
  }, [focusTodayMin]);

  const setPlaybackRate = (value: number) => {
    setSpeed(value);
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

  const jumpTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  const addTimestampNote = () => {
    if (!videoRef.current || !noteDraft.trim()) return;
    setVideoNotes((prev) => [...prev, { at: Math.floor(videoRef.current!.currentTime), note: noteDraft.trim() }]);
    setNoteDraft("");
  };

  const tryPiP = async () => {
    if (!videoRef.current) return;
    const anyDoc = document as any;
    if (!anyDoc.pictureInPictureEnabled) {
      toast({ variant: "destructive", title: "Trình duyệt không hỗ trợ PiP" });
      return;
    }
    try {
      await videoRef.current.requestPictureInPicture();
    } catch (_error) {
      toast({ variant: "destructive", title: "Không thể bật Picture-in-Picture" });
    }
  };

  const addMindMap = () => {
    if (!mindRoot.trim()) return;
    const children = mindChildren.split(",").map((x) => x.trim()).filter(Boolean);
    setMindNodes((prev) => [...prev, { id: `m-${Date.now()}`, label: mindRoot.trim(), children }]);
    setMindRoot("");
    setMindChildren("");
  };

  const exportMindMapPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#031126";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#eef3ff";
    ctx.font = "bold 42px Arial";
    ctx.fillText("EduPro Mind Map", 40, 70);

    let y = 140;
    mindNodes.forEach((node) => {
      ctx.fillStyle = "#7dc4ff";
      ctx.font = "bold 28px Arial";
      ctx.fillText(node.label, 60, y);
      ctx.fillStyle = "#eaf2ff";
      ctx.font = "22px Arial";
      node.children.forEach((child, idx) => ctx.fillText(`- ${child}`, 100, y + 38 + idx * 28));
      y += 120;
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "edupro-mindmap.png";
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Content & Learning Features</h1>
          <p className="text-muted-foreground mt-2">Video học, tài liệu, mind map và Pomodoro timer tích hợp.</p>
        </div>

        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="video">Video bài giảng</TabsTrigger>
            <TabsTrigger value="resources">Tài liệu</TabsTrigger>
            <TabsTrigger value="mindmap">Mind map</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Video player</CardTitle>
                  <CardDescription>Hỗ trợ tốc độ 0.5x-2x, PiP, fullscreen, transcript clickable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full rounded-lg border"
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {[0.5, 1, 1.25, 1.5, 2].map((value) => (
                      <Button key={value} variant={speed === value ? "default" : "outline"} size="sm" onClick={() => setPlaybackRate(value)}>
                        {value}x
                      </Button>
                    ))}
                    <Button variant="secondary" size="sm" onClick={tryPiP}>Picture-in-Picture</Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú theo timestamp</Label>
                    <div className="flex gap-2">
                      <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Note cho thời điểm hiện tại..." />
                      <Button onClick={addTimestampNote}>Lưu note</Button>
                    </div>
                    <div className="space-y-1">
                      {videoNotes.map((note, idx) => (
                        <button key={`${note.at}-${idx}`} type="button" onClick={() => jumpTo(note.at)} className="block w-full rounded border px-2 py-1 text-left text-sm hover:bg-accent">
                          [{Math.floor(note.at / 60)}:{String(note.at % 60).padStart(2, "0")}] {note.note}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                  <CardDescription>Click timestamp để nhảy tới đoạn tương ứng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transcript.map((item) => (
                    <button key={item.t} type="button" className="w-full rounded-lg border px-3 py-2 text-left hover:bg-accent" onClick={() => jumpTo(item.t)}>
                      <p className="text-xs text-primary">[{Math.floor(item.t / 60)}:{String(item.t % 60).padStart(2, "0")}]</p>
                      <p className="text-sm">{item.text}</p>
                    </button>
                  ))}

                  <div className="pt-2">
                    {isPremium ? (
                      <Button className="gap-2"><Download className="h-4 w-4" /> Download offline</Button>
                    ) : (
                      <Badge variant="outline">Download offline (Premium)</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tài liệu & Công thức</CardTitle>
                <CardDescription>Search công thức (KaTeX-ready), tải PDF tóm tắt, vocab list IELTS/SAT.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search công thức..." />
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredFormulas.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{item.topic}</p>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 rounded bg-muted px-2 py-1 font-mono text-sm">{item.latex}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-1"><FileText className="h-4 w-4" /> PDF Toán</Button>
                  <Button variant="outline" className="gap-1"><FileText className="h-4 w-4" /> PDF Vật lý</Button>
                  <Button variant="outline" className="gap-1"><FileText className="h-4 w-4" /> PDF IELTS Vocab</Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vocabulary test nhanh</CardTitle>
                    <CardDescription>Word: <strong>meticulous</strong> nghĩa là gì?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input value={vocabAnswer} onChange={(e) => setVocabAnswer(e.target.value)} placeholder="Nhập nghĩa tiếng Việt..." />
                    <Button
                      onClick={() => {
                        const ok = vocabAnswer.toLowerCase().includes("tỉ mỉ") || vocabAnswer.toLowerCase().includes("cẩn thận");
                        setVocabResult(ok ? "correct" : "wrong");
                      }}
                    >
                      Kiểm tra
                    </Button>
                    {vocabResult && (
                      <Badge variant={vocabResult === "correct" ? "secondary" : "destructive"}>
                        {vocabResult === "correct" ? "Đúng rồi!" : "Chưa đúng, gợi ý: tỉ mỉ / cẩn thận."}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mindmap" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Mind map tương tác</CardTitle>
                <CardDescription>Tạo mind map riêng theo chủ đề và export PNG/PDF.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input value={mindRoot} onChange={(e) => setMindRoot(e.target.value)} placeholder="Node chính" />
                  <Input value={mindChildren} onChange={(e) => setMindChildren(e.target.value)} placeholder="Node con, cách nhau dấu phẩy" />
                  <Button onClick={addMindMap}>Thêm node</Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {mindNodes.map((node) => (
                    <div key={node.id} className="rounded-xl border p-3">
                      <p className="font-semibold text-primary">{node.label}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {node.children.map((child) => (
                          <Badge key={child} variant="outline">{child}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={exportMindMapPNG}>Export PNG</Button>
                  <Button variant="outline" onClick={() => window.print()}>Export PDF</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary" /> Pomodoro Timer</CardTitle>
                <CardDescription>25 phút học / 5 phút nghỉ tích hợp với lộ trình học.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">{isBreak ? "Break time" : "Focus time"}</p>
                  <p className="text-5xl font-bold">{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={() => setIsRunning((prev) => !prev)} className="gap-1">
                      {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isRunning ? "Pause" : "Start"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRunning(false);
                        setIsBreak(false);
                        setSecondsLeft(25 * 60);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Hôm nay</p>
                    <p className="text-xl font-bold">{focusTodayMin} phút</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">7 ngày</p>
                    <p className="text-xl font-bold">{pomodoroStats.week} phút</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">30 ngày</p>
                    <p className="text-xl font-bold">{pomodoroStats.month} phút</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chrome extension (tùy chọn)</CardTitle>
                    <CardDescription>Block mạng xã hội khi đang Pomodoro focus mode.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">Roadmap: Social block extension</Badge>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
