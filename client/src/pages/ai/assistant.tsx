import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, SendHorizontal, Sparkles } from "lucide-react";
import AIFeaturesLayout from "./layout";

type ChatMessage = { role: "user" | "assistant"; content: string };

const DAILY_LIMIT_FREE = 5;
const COUNTER_KEY = "ai-assistant-free-counter-v1";

function getCounterForToday() {
  const today = new Date().toISOString().slice(0, 10);
  if (typeof window === "undefined") return { date: today, count: 0 };
  const raw = localStorage.getItem(COUNTER_KEY);
  if (!raw) return { date: today, count: 0 };
  try {
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date !== today) return { date: today, count: 0 };
    return parsed;
  } catch {
    return { date: today, count: 0 };
  }
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Mình là Trợ lý AI (mock). Bạn hỏi bài, mình sẽ gợi ý hướng giải từng bước." },
  ]);
  const [question, setQuestion] = useState("");
  const [counter, setCounter] = useState(getCounterForToday());
  const remaining = useMemo(() => Math.max(0, DAILY_LIMIT_FREE - counter.count), [counter.count]);

  const sendMessage = () => {
    const content = question.trim();
    if (!content || remaining <= 0) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
      {
        role: "assistant",
        content: `Hướng giải gợi ý:\n1) Xác định dữ kiện chính trong câu hỏi.\n2) Chọn công thức/luật phù hợp.\n3) Thử giải từng bước và tự kiểm tra đáp án cuối.\n\nBạn có thể hỏi tiếp: "Tại sao đáp án là B?"`,
      },
    ];
    setMessages(nextMessages);
    setQuestion("");

    const today = new Date().toISOString().slice(0, 10);
    const next = { date: today, count: counter.count + 1 };
    setCounter(next);
    if (typeof window !== "undefined") localStorage.setItem(COUNTER_KEY, JSON.stringify(next));
  };

  return (
    <AIFeaturesLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Trợ lý AI</CardTitle>
            <CardDescription>Chat theo ngữ cảnh bài làm. Hiện tại đang ở chế độ mock, chưa nối model AI thật.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Free còn {remaining}/{DAILY_LIMIT_FREE} câu hôm nay</Badge>
              <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Pro: không giới hạn</Badge>
            </div>

            <div className="max-h-[380px] space-y-2 overflow-y-auto rounded-lg border p-3">
              {messages.map((m, idx) => (
                <div key={`${m.role}-${idx}`} className={m.role === "user" ? "text-right" : ""}>
                  <div className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='Ví dụ: "Tại sao đáp án là B?"'
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <Button onClick={sendMessage} disabled={remaining <= 0 || !question.trim()}>
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AIFeaturesLayout>
  );
}
