import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useResults } from "@/hooks/use-results";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Share2, Sparkles, Users, ShieldCheck, Link as LinkIcon } from "lucide-react";

type GroupItem = {
  id: string;
  name: string;
  members: number;
  limit: number;
};

type ForumThread = {
  id: string;
  title: string;
  body: string;
  tag: string;
  upvotes: number;
  verified: boolean;
  author: string;
};

const initialThreads: ForumThread[] = [
  {
    id: "th-1",
    title: "Cách xử lý dạng Reading Inference trong IELTS?",
    body: "Mình thường sai ở inference, mọi người có checklist làm bài không?",
    tag: "IELTS Reading",
    upvotes: 18,
    verified: true,
    author: "Gia sư Minh",
  },
  {
    id: "th-2",
    title: "Xác suất thống kê THPTQG nên ôn theo lộ trình nào?",
    body: "Xin tài liệu và bộ câu hỏi từ cơ bản đến nâng cao.",
    tag: "THPTQG Toán",
    upvotes: 9,
    verified: false,
    author: "NQ Student",
  },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const { data: results = [] } = useResults();
  const { toast } = useToast();
  const isPremium = user?.plan === "premium" || user?.plan === "pro";
  const memberLimit = isPremium ? 50 : 10;

  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<GroupItem[]>([
    { id: "g-1", name: "IELTS 7.0 Sprint", members: 8, limit: memberLimit },
  ]);
  const [assignmentDone, setAssignmentDone] = useState<Record<string, boolean>>({});
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({
    "An": 2,
    "Bình": 5,
    "Chi": 1,
    "Dũng": 7,
  });

  const [threads, setThreads] = useState<ForumThread[]>(initialThreads);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadTag, setThreadTag] = useState("IELTS");
  const [activeTab, setActiveTab] = useState("groups");

  const [referralInvites, setReferralInvites] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionProgress((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([name, q]) => {
          next[name] = Math.min(40, q + (Math.random() > 0.45 ? 1 : 0));
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["groups", "forum", "share", "referral"].includes(tab)) {
      setActiveTab(tab);
    }
    const question = params.get("question");
    if (question) {
      setThreadTitle(`Giải thích câu này: ${question.slice(0, 100)}`);
      setThreadBody("Mình chưa hiểu rõ logic giải câu này, mong mọi người giải thích từng bước.");
      setThreadTag("Hỏi nhanh");
    }
  }, []);

  const latestResult = results[0];
  const latestPercentage = latestResult
    ? Math.round((latestResult.score / Math.max(1, latestResult.totalQuestions)) * 100)
    : 0;
  const shareComparison = latestPercentage - 68;

  const referralLink = useMemo(() => {
    const code = user?.username || user?.id || "student";
    return `https://edupro.app/r/${code}`;
  }, [user?.id, user?.username]);

  const createGroup = () => {
    if (!groupName.trim()) return;
    setGroups((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        name: groupName.trim(),
        members: 1,
        limit: memberLimit,
      },
    ]);
    setGroupName("");
    toast({ title: "Đã tạo nhóm học tập", description: `Giới hạn thành viên: ${memberLimit}` });
  };

  const submitThread = () => {
    if (!threadTitle.trim() || !threadBody.trim()) return;
    const next: ForumThread = {
      id: `th-${Date.now()}`,
      title: threadTitle.trim(),
      body: threadBody.trim(),
      tag: threadTag,
      upvotes: 0,
      verified: false,
      author: `${user?.firstName || "Bạn"} ${user?.lastName || ""}`.trim(),
    };
    setThreads((prev) => [next, ...prev]);
    setThreadTitle("");
    setThreadBody("");
    toast({ title: "Đã tạo thread", description: "Câu hỏi của bạn đã lên forum." });
  };

  const upvote = (id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t)));
  };

  const drawShareCard = (vertical = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = vertical ? 1080 : 1200;
    canvas.height = vertical ? 1920 : 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#04102a");
    grad.addColorStop(1, "#0b2a5a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f3f6ff";
    ctx.font = "bold 74px Arial";
    ctx.fillText("EduPro Result", 80, 130);
    ctx.font = "52px Arial";
    ctx.fillText(`Score: ${latestPercentage}%`, 80, 240);
    ctx.fillText(`Test: ${latestResult?.testId || "Practice Test"}`, 80, 320);
    ctx.fillText(`Vs Avg: ${shareComparison >= 0 ? "+" : ""}${shareComparison}%`, 80, 400);
    ctx.fillText(`User: ${user?.username || "student"}`, 80, 480);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = vertical ? "edupro-story-9x16.png" : "edupro-share-card.png";
    link.click();
  };

  const openShare = (platform: "facebook" | "twitter") => {
    const text = encodeURIComponent(`Mình vừa đạt ${latestPercentage}% trên EduPro!`);
    const url = encodeURIComponent("https://edupro.app");
    const target =
      platform === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Social & Community</h1>
          <p className="text-muted-foreground mt-2">Study groups, forum Q&A, share kết quả và referral.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="groups">Study Groups</TabsTrigger>
            <TabsTrigger value="forum">Forum / Q&A</TabsTrigger>
            <TabsTrigger value="share">Chia sẻ kết quả</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Tạo nhóm học tập</CardTitle>
                  <CardDescription>
                    Free tối đa 10 người, Pro/Premium tối đa 50 người.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label>Tên nhóm</Label>
                  <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="VD: THPTQG 2026 - Team A" />
                  <Button onClick={createGroup}>Tạo nhóm</Button>
                  <div className="space-y-2 pt-2">
                    {groups.map((group) => (
                      <div key={group.id} className="rounded-lg border p-3">
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">{group.members}/{group.limit} thành viên</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Group leaderboard + assignment tracking</CardTitle>
                  <CardDescription>Giao bài tập cho nhóm và theo dõi ai đã làm.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["An", "Bình", "Chi", "Dũng"].map((name, idx) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs text-muted-foreground">#{idx + 1}</span>
                        <span>{name}</span>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!assignmentDone[name]}
                          onChange={(e) => setAssignmentDone((prev) => ({ ...prev, [name]: e.target.checked }))}
                        />
                        Đã làm bài
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Group study session (Realtime)</CardTitle>
                <CardDescription>Thấy các thành viên đang làm câu nào theo thời gian thực.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(sessionProgress).map(([name, q]) => (
                  <div key={name} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">Đang ở câu {q}</p>
                      </div>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-primary transition-all" style={{ width: `${Math.min(100, q * 2.5)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forum" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Đăng câu hỏi</CardTitle>
                <CardDescription>Gắn tag môn học, upvote câu trả lời hay.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)} placeholder="Tiêu đề câu hỏi..." />
                <Input value={threadTag} onChange={(e) => setThreadTag(e.target.value)} placeholder="Tag: IELTS / SAT / THPTQG..." />
                <Textarea value={threadBody} onChange={(e) => setThreadBody(e.target.value)} placeholder="Mô tả chi tiết câu hỏi..." />
                <Button onClick={submitThread}>Tạo thread</Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {threads.map((thread) => (
                <Card key={thread.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{thread.title}</p>
                          {thread.verified && (
                            <Badge variant="secondary" className="gap-1">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{thread.author} • {thread.tag}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => upvote(thread.id)}>
                        <ArrowUp className="h-4 w-4" /> {thread.upvotes}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{thread.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" /> Chia sẻ kết quả kiểu Wrapped</CardTitle>
                <CardDescription>Card gồm điểm, tên đề, so sánh với trung bình và avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white">
                  <p className="text-sm uppercase tracking-wide text-blue-200">EduPro Wrapped</p>
                  <h3 className="mt-1 text-2xl font-bold">{latestPercentage}%</h3>
                  <p className="text-sm text-blue-100">Đề: {latestResult?.testId || "Practice test"}</p>
                  <p className="text-sm text-blue-100">So với trung bình: {shareComparison >= 0 ? "+" : ""}{shareComparison}%</p>
                  <p className="mt-3 text-sm text-blue-200">@{user?.username || "student"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => drawShareCard(false)}>Tải card PNG</Button>
                  <Button variant="outline" onClick={() => drawShareCard(true)}>Tải story 9:16</Button>
                  <Button variant="secondary" onClick={() => openShare("facebook")}>Share Facebook</Button>
                  <Button variant="secondary" onClick={() => openShare("twitter")}>Share Twitter/X</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary" /> Referral System</CardTitle>
                <CardDescription>1 bạn = cả 2 nhận 7 ngày Pro, 5 bạn = 1 tháng Pro.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Link giới thiệu của bạn</p>
                  <p className="font-mono text-sm">{referralLink}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Đã mời thành công</p>
                    <p className="text-2xl font-bold">{referralInvites}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Phần thưởng hiện tại</p>
                    <p className="text-lg font-semibold">
                      {referralInvites >= 5 ? "1 tháng Pro" : referralInvites >= 1 ? "7 ngày Pro (cả 2)" : "Chưa đạt mốc"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        toast({ title: "Đã copy referral link" });
                      } catch (_error) {
                        toast({ variant: "destructive", title: "Không thể copy tự động", description: referralLink });
                      }
                    }}
                  >
                    Copy link
                  </Button>
                  <Button onClick={() => setReferralInvites((prev) => prev + 1)} className="gap-1">
                    <Sparkles className="h-4 w-4" />
                    Simulate có thêm 1 bạn dùng link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
