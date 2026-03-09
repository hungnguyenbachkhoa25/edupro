import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { School, Users, Activity, DollarSign } from "lucide-react";

export default function AdminPortalPage() {
  const { toast } = useToast();

  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [latex, setLatex] = useState("x = (-b ± sqrt(b^2 - 4ac)) / (2a)");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [onlineUsers, setOnlineUsers] = useState(120);
  const [activeTests, setActiveTests] = useState(34);
  const [liveQuizScores, setLiveQuizScores] = useState<Record<string, number>>({
    "Lớp 12A1": 1200,
    "Lớp 12A2": 980,
    "Lớp 12A3": 860,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineUsers((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
      setActiveTests((prev) => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
      setLiveQuizScores((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([key, score]) => {
          next[key] = score + Math.floor(Math.random() * 25);
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const funnelData = [
    { stage: "Đăng ký", value: 1000 },
    { stage: "Làm bài", value: 690 },
    { stage: "Active 7d", value: 470 },
    { stage: "Upgrade", value: 112 },
  ];

  const revenueData = [
    { kpi: "MRR", value: 124000000 },
    { kpi: "Churn", value: 8.4 },
    { kpi: "LTV", value: 2840000 },
  ];

  const liveQuizRows = useMemo(() => {
    return Object.entries(liveQuizScores)
      .map(([cls, score]) => ({ cls, score }))
      .sort((a, b) => b.score - a.score);
  }, [liveQuizScores]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin & Teacher Portal</h1>
          <p className="text-muted-foreground mt-2">Content editor, analytics admin, teacher portal và live quiz realtime.</p>
        </div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Content Editor</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Admin</TabsTrigger>
            <TabsTrigger value="teacher">Teacher Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rich content editor (LaTeX-ready)</CardTitle>
                <CardDescription>Tạo câu hỏi có LaTeX, upload media, preview trước khi publish.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={questionTitle} onChange={(e) => setQuestionTitle(e.target.value)} placeholder="Tiêu đề câu hỏi..." />
                <Textarea value={questionBody} onChange={(e) => setQuestionBody(e.target.value)} placeholder="Nội dung câu hỏi..." className="min-h-[120px]" />
                <Input value={latex} onChange={(e) => setLatex(e.target.value)} placeholder="LaTeX..." />
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Preview (KaTeX-ready):</p>
                  <p className="font-mono text-sm">{latex}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Upload image</Label>
                    <Input type="file" />
                  </div>
                  <div>
                    <Label>Upload audio (Listening)</Label>
                    <Input type="file" />
                  </div>
                  <div>
                    <Label>YouTube embed</Label>
                    <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => toast({ title: "Đã preview", description: "Câu hỏi hiển thị như user trước khi publish." })}>Preview</Button>
                  <Button variant="outline" onClick={() => toast({ title: "Đã publish câu hỏi" })}>Publish</Button>
                  <Button variant="secondary" onClick={() => toast({ title: "AI parsing", description: "Bulk import Word/Excel/PDF đang xử lý..." })}>
                    Bulk import (AI parsing)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">User online realtime</p>
                  <p className="text-2xl font-bold">{onlineUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Đề đang làm</p>
                  <p className="text-2xl font-bold">{activeTests}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">A/B pricing test</p>
                  <p className="text-2xl font-bold">B +12.4%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Funnel analysis</CardTitle>
                  <CardDescription>Đăng ký → làm bài → upgrade</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="currentColor" className="fill-primary/80" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue dashboard</CardTitle>
                  <CardDescription>MRR, churn rate, LTV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {revenueData.map((item) => (
                    <div key={item.kpi} className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">{item.kpi}</span>
                      <span className="font-semibold">
                        {item.kpi === "Churn" ? `${item.value}%` : item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teacher" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <School className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lớp học</p>
                    <p className="text-xl font-bold">12 lớp</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Học sinh</p>
                    <p className="text-xl font-bold">438</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Live quiz đang chạy</p>
                    <p className="text-xl font-bold">3</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Teacher actions</CardTitle>
                <CardDescription>Tạo lớp, thêm học sinh, giao bài, đặt deadline.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button>Tạo lớp mới</Button>
                <Button variant="outline">Thêm học sinh</Button>
                <Button variant="outline">Giao bài tập</Button>
                <Button variant="secondary">Set deadline</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live quiz realtime (Kahoot-style)</CardTitle>
                <CardDescription>Điểm lớp cập nhật theo thời gian thực.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {liveQuizRows.map((row, idx) => (
                  <div key={row.cls} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-xs text-muted-foreground">#{idx + 1}</span>
                      <span>{row.cls}</span>
                    </div>
                    <Badge variant={idx === 0 ? "default" : "secondary"}>{row.score.toLocaleString()} pts</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
