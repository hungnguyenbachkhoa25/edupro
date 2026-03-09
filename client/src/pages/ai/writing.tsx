import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AIFeaturesLayout from "./layout";

type WritingResponse = {
  scores: { tr: number; cc: number; lr: number; gra: number; overall: number };
  highlights: Array<{ type: "grammar" | "vocab-repeat" | "improvement"; snippet: string; message: string }>;
  sampleComparison: { band7: string; band8: string; currentGap: string };
  meta: { wordCount: number };
  scoredAt: string;
};

const HISTORY_KEY = "ai-writing-history-v1";

export default function AIWritingPage() {
  const { toast } = useToast();
  const [writingMode, setWritingMode] = useState("IELTS_TASK_2");
  const [essay, setEssay] = useState("");
  const [writingResult, setWritingResult] = useState<WritingResponse | null>(null);
  const [isScoring, setIsScoring] = useState(false);

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
    } catch (error) {
      toast({ variant: "destructive", title: "Không thể chấm bài", description: (error as Error).message });
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <AIFeaturesLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chấm Writing AI</CardTitle>
            <CardDescription>Chấm IELTS Writing/THPTQG Văn theo TR, CC, LR, GRA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
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
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="min-h-[220px]"
              placeholder="Dán bài viết vào đây để AI chấm..."
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
                      {h.type === "grammar" ? "Đỏ" : h.type === "vocab-repeat" ? "Vàng" : "Xanh"}
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
              <CardHeader><CardTitle>Lịch sử tiến bộ</CardTitle></CardHeader>
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
      </div>
    </AIFeaturesLayout>
  );
}
