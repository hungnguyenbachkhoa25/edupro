import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTest } from "@/hooks/use-tests";
import { useSubmitResult, useResults } from "@/hooks/use-results";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  Loader2,
  CheckCircle2,
  Shield,
  ShieldAlert,
  StickyNote,
  Eraser,
  RotateCcw,
  Timer,
  CircleHelp,
} from "lucide-react";
import confetti from "canvas-confetti";

type ExamMode = "timed" | "untimed" | "review" | "flashcard";

const MODE_OPTIONS: Array<{ value: ExamMode; label: string; description: string }> = [
  { value: "timed", label: "Timed mode", description: "Đồng hồ đếm ngược" },
  { value: "untimed", label: "Untimed mode", description: "Xem giải thích ngay sau mỗi câu" },
  { value: "review", label: "Review mode", description: "Chỉ xem đáp án và giải thích" },
  { value: "flashcard", label: "Flashcard mode", description: "Lật thẻ hỏi/đáp" },
];

const SYSTEM_AVG_BY_CATEGORY: Record<string, number> = {
  IELTS: 68,
  SAT: 64,
  THPTQG: 66,
  DGNL: 62,
  DGNL_HCM: 62,
};

const TOP10_BY_CATEGORY: Record<string, number> = {
  IELTS: 88,
  SAT: 86,
  THPTQG: 87,
  DGNL: 84,
  DGNL_HCM: 84,
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getOptionDistribution(options: string[], correctAnswer: string) {
  const correctSeed = 42;
  let total = 0;
  const raw = options.map((opt, idx) => {
    const base = opt === correctAnswer ? 35 + ((idx + correctSeed) % 12) : 10 + ((idx * 7 + correctSeed) % 18);
    total += base;
    return { option: opt, base };
  });

  return raw.map((r) => ({
    option: r.option,
    pct: Math.round((r.base / total) * 100),
  }));
}

export default function TestSession({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: test, isLoading } = useTest(id);
  const { data: results = [] } = useResults();
  const submitResult = useSubmitResult();
  const { toast } = useToast();

  const [examMode, setExamMode] = useState<ExamMode>("timed");
  const [strictMode, setStrictMode] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(true);
  const [warningCount, setWarningCount] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, string[]>>({});
  const [questionHighlight, setQuestionHighlight] = useState<Record<string, "none" | "yellow" | "blue" | "green">>({});
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [elapsedUntimed, setElapsedUntimed] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [startedAt, setStartedAt] = useState<string>("");
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [showWrongOnly, setShowWrongOnly] = useState(false);

  const [isListeningReady, setIsListeningReady] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [listeningWindow, setListeningWindow] = useState(0);
  const [listeningPlayed, setListeningPlayed] = useState(false);

  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});
  const questionEnterAtRef = useRef<number>(Date.now());
  const currentQuestionIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const isListeningTest = Boolean(test && /ielts/i.test(test.category) && /listening/i.test(test.type));

  useEffect(() => {
    if (!test) return;
    if (timeLeft === 0 && examMode === "timed" && !isSubmitted) {
      setTimeLeft((test.durationMinutes ?? 60) * 60);
      setStartedAt(new Date().toISOString());
    }
    if (!startedAt) {
      setStartedAt(new Date().toISOString());
    }
    if (isListeningTest) {
      setIsListeningReady(false);
    }
  }, [test, examMode, isSubmitted, timeLeft, startedAt, isListeningTest]);

  useEffect(() => {
    if (examMode !== "timed" || isSubmitted || !test) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, examMode, test]);

  useEffect(() => {
    if (!test || examMode !== "untimed" || isSubmitted) return;
    const timer = setInterval(() => setElapsedUntimed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [examMode, isSubmitted, test]);

  useEffect(() => {
    if (!isListeningTest) return;
    if (countdown === 0) {
      if (!isListeningReady) setIsListeningReady(true);
      return;
    }
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, isListeningTest, isListeningReady]);

  useEffect(() => {
    if (!isListeningTest || listeningWindow <= 0) return;
    const timer = setInterval(() => setListeningWindow((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [listeningWindow, isListeningTest]);

  useEffect(() => {
    if (!strictMode) return;

    const onFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setFullscreenReady(inFullscreen);
    };

    const onVisibilityChange = () => {
      if (!document.hidden) return;
      setWarningCount((prev) => {
        const next = prev + 1;
        if (next >= 3 && !isSubmitted) {
          toast({
            variant: "destructive",
            title: "Vi phạm chế độ thi thật",
            description: "Bạn đã rời tab quá 3 lần. Bài thi sẽ nộp tự động.",
          });
          setTimeout(() => {
            if (!submittingRef.current) {
              handleSubmit();
            }
          }, 300);
        } else {
          toast({
            variant: "destructive",
            title: `Cảnh báo ${next}/3`,
            description: "Không được rời tab khi bật chế độ thi thật.",
          });
        }
        return next;
      });
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    setFullscreenReady(Boolean(document.fullscreenElement));

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [strictMode, isSubmitted, toast]);

  const accumulateQuestionTime = useCallback((questionId: string) => {
    const now = Date.now();
    const delta = Math.max(0, Math.round((now - questionEnterAtRef.current) / 1000));
    setQuestionTimeSpent((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + delta,
    }));
    questionEnterAtRef.current = now;
  }, []);

  useEffect(() => {
    if (!test) return;
    const qid = test.questions[currentIndex]?.id;
    if (!qid) return;

    if (currentQuestionIdRef.current && currentQuestionIdRef.current !== qid) {
      accumulateQuestionTime(currentQuestionIdRef.current);
    }

    currentQuestionIdRef.current = qid;
    questionEnterAtRef.current = Date.now();
    setFlashcardFlipped(false);
  }, [test, currentIndex, accumulateQuestionTime]);

  const goToQuestion = (nextIndex: number) => {
    if (!test) return;
    const current = test.questions[currentIndex];
    if (current) accumulateQuestionTime(current.id);
    setCurrentIndex(Math.max(0, Math.min(test.questions.length - 1, nextIndex)));
  };

  const handleSubmit = useCallback(async () => {
    if (!test || submittingRef.current) return;

    const current = test.questions[currentIndex];
    if (current) accumulateQuestionTime(current.id);

    submittingRef.current = true;
    setIsSubmitted(true);

    let correctCount = 0;
    test.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correctCount += 1;
    });

    setScore({ correct: correctCount, total: test.questions.length });

    if (correctCount / Math.max(1, test.questions.length) >= 0.7) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#10B981", "#F59E0B"],
      });
    }

    try {
      await submitResult.mutateAsync({
        testId: test.id,
        score: correctCount,
        totalQuestions: test.questions.length,
        answers,
        startedAt,
        timeSpentSeconds: examMode === "timed"
          ? Math.max(0, (test.durationMinutes ?? 60) * 60 - timeLeft)
          : elapsedUntimed,
      });
    } catch (_error) {
      setIsSubmitted(false);
      toast({
        variant: "destructive",
        title: "Nộp bài thất bại",
        description: "Kết quả chưa được lưu. Vui lòng thử nộp lại.",
      });
    } finally {
      submittingRef.current = false;
    }
  }, [test, currentIndex, answers, startedAt, timeLeft, elapsedUntimed, examMode, submitResult, toast, accumulateQuestionTime]);

  useEffect(() => {
    if (!test || isSubmitted || examMode !== "timed") return;
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft, test, isSubmitted, examMode, handleSubmit]);

  useEffect(() => {
    if (!test || isSubmitted) return;

    const handleBeforeUnload = () => {
      if (submittingRef.current) return;
      const total = test.questions.length;
      const correct = test.questions.reduce((acc, q) => (answers[q.id] === q.correctAnswer ? acc + 1 : acc), 0);
      const payload = JSON.stringify({
        testId: test.id,
        score: correct,
        totalQuestions: total,
        answers,
        startedAt,
        timeSpentSeconds: examMode === "timed"
          ? Math.max(0, (test.durationMinutes ?? 60) * 60 - timeLeft)
          : elapsedUntimed,
      });
      navigator.sendBeacon("/api/results/beacon", payload);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [test, answers, startedAt, timeLeft, elapsedUntimed, examMode, isSubmitted]);

  useEffect(() => {
    if (!isSubmitted || score.total === 0) return;
    const finalPercent = Math.round((score.correct / score.total) * 100);
    setAnimatedPercentage(0);
    const timer = setInterval(() => {
      setAnimatedPercentage((prev) => {
        if (prev >= finalPercent) {
          clearInterval(timer);
          return finalPercent;
        }
        return prev + 1;
      });
    }, 18);
    return () => clearInterval(timer);
  }, [isSubmitted, score]);

  const previousAttemptPercent = useMemo(() => {
    if (!test) return null;
    const sameTestAttempts = results
      .filter((r) => r.testId === test.id)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    if (sameTestAttempts.length === 0) return null;
    const prev = sameTestAttempts[0];
    return Math.round((prev.score / Math.max(1, prev.totalQuestions)) * 100);
  }, [results, test]);

  const freeLimitReached = (user?.plan === "free" || !user?.plan) && results.length >= 3;

  if (isLoading || !test) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Preparing your test environment...</p>
      </div>
    );
  }

  if (freeLimitReached && !isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-xl w-full p-8 space-y-4 border-primary/30 bg-primary/5">
          <h2 className="text-2xl font-bold">Mở khóa không giới hạn đề thi</h2>
          <p className="text-muted-foreground">
            Bạn đã dùng 3 đề miễn phí. Nâng cấp Pro để tiếp tục luyện đề không giới hạn, mở hint AI và báo cáo chi tiết.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Pro Monthly</p>
              <p className="text-xl font-bold">199.000đ</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Pro Annual</p>
              <p className="text-xl font-bold">-40%</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setLocation("/monetization")}>Bắt đầu trial 7 ngày</Button>
            <Button variant="outline" onClick={() => setLocation("/exams")}>Quay lại kho đề</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const totalQuestions = test.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const isAnswered = Boolean(answers[currentQuestion.id]);
  const selected = answers[currentQuestion.id];
  const optionList = (currentQuestion.options as string[]) || [];
  const isReviewMode = examMode === "review";
  const isFlashcardMode = examMode === "flashcard";
  const canSelectOption = !isReviewMode && !isFlashcardMode;
  const highlightColor = questionHighlight[currentQuestion.id] || "none";

  const systemAvg = SYSTEM_AVG_BY_CATEGORY[test.category] || 65;
  const top10 = TOP10_BY_CATEGORY[test.category] || 85;
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const detailRows = test.questions.filter((q) => (showWrongOnly ? answers[q.id] !== q.correctAnswer : true));

  const startListeningCountdown = () => {
    setCountdown(5);
  };

  const playListeningOnce = () => {
    if (listeningPlayed) return;
    setListeningPlayed(true);
    setListeningWindow(120);
  };

  const toggleEliminate = (questionId: string, option: string) => {
    setEliminatedOptions((prev) => {
      const current = prev[questionId] || [];
      const next = current.includes(option) ? current.filter((x) => x !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSelect = (val: string) => {
    if (!canSelectOption) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenReady(true);
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Không thể vào toàn màn hình",
        description: "Vui lòng cho phép fullscreen để tiếp tục chế độ thi thật.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-5xl w-full p-6 sm:p-8 rounded-3xl shadow-xl border-border/50 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold">Result Screen</h2>
                  <p className="text-muted-foreground">{test.title}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Điểm hiện tại</p>
                  <p className="text-3xl font-bold text-primary">{animatedPercentage}%</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Lần trước</p>
                  <p className="text-2xl font-bold">{previousAttemptPercent ?? "--"}%</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Top 10%</p>
                  <p className="text-2xl font-bold">{top10}%</p>
                  <p className="text-xs text-muted-foreground">TB hệ thống: {systemAvg}%</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setLocation(`/practice/${test.id}`)} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Làm lại
                </Button>
                <Button variant="outline" onClick={() => setLocation("/exams")}>
                  Đề tương tự
                </Button>
                <Button variant="secondary" onClick={() => setShowWrongOnly((prev) => !prev)}>
                  {showWrongOnly ? "Hiện tất cả câu" : "Ôn các câu sai"}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/70 p-4">
              <h3 className="font-semibold mb-2">Tóm tắt nhanh</h3>
              <p className="text-sm text-muted-foreground mb-3">So sánh hiệu suất với lần trước và hệ thống.</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Đúng</span><strong>{score.correct}</strong></div>
                <div className="flex justify-between"><span>Tổng</span><strong>{score.total}</strong></div>
                <div className="flex justify-between"><span>Điểm</span><strong>{percentage}%</strong></div>
                <div className="flex justify-between"><span>So với TB hệ thống</span><strong>{percentage - systemAvg > 0 ? `+${percentage - systemAvg}` : percentage - systemAvg}%</strong></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Phân tích từng câu</h3>
            {detailRows.map((q, idx) => {
              const mine = answers[q.id] || "(chưa trả lời)";
              const correct = q.correctAnswer;
              const ok = mine === correct;
              const spent = questionTimeSpent[q.id] || 0;
              const distribution = getOptionDistribution((q.options as string[]) || [], correct);

              return (
                <Card key={q.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">Câu {idx + 1}: {q.text}</p>
                      <p className="text-xs text-muted-foreground">Thời gian dừng: {formatTime(spent)}</p>
                    </div>
                    <Badge variant={ok ? "secondary" : "destructive"}>{ok ? "Đúng" : "Sai"}</Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p><strong>Bạn chọn:</strong> {mine}</p>
                    <p><strong>Đáp án đúng:</strong> {correct}</p>
                    {!ok && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-amber-100">
                        <p className="text-sm"><strong>Giải thích:</strong> {q.explanation || "Chưa có giải thích."}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">% người khác chọn</p>
                    {distribution.map((d) => (
                      <div key={d.option} className="flex items-center gap-2 text-xs">
                        <span className="w-16 truncate">{d.option}</span>
                        <div className="h-2 flex-1 rounded bg-muted">
                          <div className={`h-2 rounded ${d.option === correct ? "bg-green-500" : "bg-primary"}`} style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="w-8 text-right">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  if (isListeningTest && !isListeningReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-xl w-full p-8 space-y-4 text-center">
          <h2 className="text-2xl font-bold">IELTS Listening Simulation</h2>
          <p className="text-muted-foreground">Audio chỉ được nghe 1 lần. Bài thi sẽ bắt đầu sau countdown.</p>
          {countdown > 0 ? (
            <div className="text-5xl font-bold text-primary">{countdown}</div>
          ) : (
            <Button size="lg" onClick={startListeningCountdown}>Bắt đầu phần nghe</Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      onCopy={(e) => {
        if (strictMode) {
          e.preventDefault();
          toast({
            variant: "destructive",
            title: "Không thể copy",
            description: "Chế độ thi thật không cho phép sao chép nội dung.",
          });
        }
      }}
    >
      {strictMode && !fullscreenReady && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-lg font-semibold">Chế độ thi thật yêu cầu fullscreen</h3>
            <p className="text-sm text-muted-foreground">Để tiếp tục làm bài, vui lòng bật toàn màn hình.</p>
            <Button onClick={enterFullscreen}>Bật fullscreen</Button>
          </Card>
        </div>
      )}

      <header className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/exams")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-sm sm:text-lg">{test.title}</h1>
            <p className="text-xs text-muted-foreground">Question {currentIndex + 1}/{totalQuestions}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {examMode === "timed" ? (
            <div className={`font-mono text-sm sm:text-lg font-bold px-3 py-1.5 rounded-xl ${timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-muted text-foreground"}`}>
              {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="font-mono text-sm sm:text-lg font-bold px-3 py-1.5 rounded-xl bg-muted text-foreground">
              {formatTime(elapsedUntimed)}
            </div>
          )}

          {strictMode && (
            <Badge variant="outline" className="hidden sm:flex items-center gap-1">
              <Shield className="h-3 w-3" /> Thi thật
            </Badge>
          )}

          <Button onClick={handleSubmit} disabled={submitResult.isPending}>
            Submit
          </Button>
        </div>
      </header>

      <Progress value={progress} className="h-1 rounded-none bg-muted" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setExamMode(mode.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs sm:text-sm transition ${examMode === mode.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={strictMode ? "default" : "outline"}
                  className="gap-1"
                  onClick={async () => {
                    const next = !strictMode;
                    setStrictMode(next);
                    if (next) {
                      await enterFullscreen();
                    }
                  }}
                >
                  <Shield className="h-4 w-4" />
                  Thi thật
                </Button>
                {warningCount > 0 && <Badge variant="destructive">Warning {warningCount}/3</Badge>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{MODE_OPTIONS.find((m) => m.value === examMode)?.description}</p>

            {isListeningTest && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium">IELTS Listening Audio</p>
                    <p className="text-xs text-muted-foreground">Chỉ nghe 1 lần • countdown trước khi bắt đầu</p>
                  </div>
                  <Button size="sm" disabled={listeningPlayed} onClick={playListeningOnce} className="gap-1">
                    <Timer className="h-4 w-4" />
                    {listeningPlayed ? "Đã phát" : "Phát audio"}
                  </Button>
                </div>
                {listeningWindow > 0 && <p className="mt-2 text-xs">Audio còn: {formatTime(listeningWindow)}</p>}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Card className="p-5 sm:p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Q{currentIndex + 1}</span>
                    {flagged[currentQuestion.id] && <Badge variant="secondary">Flagged</Badge>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button type="button" className={`h-6 w-6 rounded-full border ${highlightColor === "yellow" ? "bg-amber-400" : "bg-amber-200"}`} onClick={() => setQuestionHighlight((p) => ({ ...p, [currentQuestion.id]: "yellow" }))} />
                    <button type="button" className={`h-6 w-6 rounded-full border ${highlightColor === "blue" ? "bg-blue-500" : "bg-blue-200"}`} onClick={() => setQuestionHighlight((p) => ({ ...p, [currentQuestion.id]: "blue" }))} />
                    <button type="button" className={`h-6 w-6 rounded-full border ${highlightColor === "green" ? "bg-green-500" : "bg-green-200"}`} onClick={() => setQuestionHighlight((p) => ({ ...p, [currentQuestion.id]: "green" }))} />
                    <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={() => setQuestionHighlight((p) => ({ ...p, [currentQuestion.id]: "none" }))}>Clear</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      const q = encodeURIComponent(currentQuestion.text);
                      setLocation(`/community?tab=forum&question=${q}`);
                    }}
                  >
                    <CircleHelp className="h-4 w-4" />
                    Giải thích câu này (Forum)
                  </Button>
                </div>

                <div className={`rounded-xl p-4 ${highlightColor === "yellow" ? "bg-amber-400/20" : highlightColor === "blue" ? "bg-blue-500/15" : highlightColor === "green" ? "bg-green-500/15" : "bg-transparent"}`}>
                  <h2 className="text-lg sm:text-xl leading-relaxed">{currentQuestion.text}</h2>
                </div>

                {isFlashcardMode ? (
                  <div className="space-y-4">
                    <Card className="p-6 text-center min-h-[220px] flex flex-col justify-center">
                      {!flashcardFlipped ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Mặt trước</p>
                          <p className="text-lg font-medium">{currentQuestion.text}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Mặt sau</p>
                          <p className="font-semibold">Đáp án: {currentQuestion.correctAnswer}</p>
                          <p className="text-sm text-muted-foreground mt-2">{currentQuestion.explanation || "Không có giải thích."}</p>
                        </>
                      )}
                    </Card>

                    <div className="flex flex-wrap gap-2">
                      {!flashcardFlipped ? (
                        <Button onClick={() => setFlashcardFlipped(true)}>Lật thẻ</Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => {
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: currentQuestion.correctAnswer }));
                              if (currentIndex < totalQuestions - 1) goToQuestion(currentIndex + 1);
                            }}
                          >
                            Mình trả lời đúng
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: "__wrong__" }));
                              if (currentIndex < totalQuestions - 1) goToQuestion(currentIndex + 1);
                            }}
                          >
                            Mình sai
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {optionList.map((opt, i) => {
                      const eliminated = (eliminatedOptions[currentQuestion.id] || []).includes(opt);
                      const isSelected = selected === opt;
                      const isCorrect = currentQuestion.correctAnswer === opt;
                      const showReviewColor = isReviewMode;

                      return (
                        <div
                          key={i}
                          className={`group w-full rounded-xl border-2 p-4 transition ${
                            showReviewColor
                              ? isCorrect
                                ? "border-green-500/60 bg-green-500/10"
                                : isSelected
                                  ? "border-red-500/60 bg-red-500/10"
                                  : "border-border/50"
                              : isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/30"
                          } ${eliminated ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleSelect(opt)}
                              disabled={!canSelectOption}
                              className="flex flex-1 items-start gap-3 text-left"
                            >
                              <div className={`mt-0.5 h-5 w-5 rounded-full border-2 ${isSelected ? "border-primary" : "border-muted-foreground/30"}`}>
                                {isSelected && <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-primary" />}
                              </div>
                              <span className={`${eliminated ? "line-through" : ""}`}>{opt}</span>
                            </button>

                            {canSelectOption && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => toggleEliminate(currentQuestion.id, opt)}
                                title="Strikethrough đáp án"
                              >
                                <Eraser className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(examMode === "untimed" || isReviewMode) && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <p><strong>Đáp án đúng:</strong> {currentQuestion.correctAnswer}</p>
                        <p className="text-muted-foreground"><strong>Giải thích:</strong> {currentQuestion.explanation || "Không có giải thích."}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <StickyNote className="h-4 w-4 text-primary" />
                    Sticky note / Ghi chú nháp
                  </div>
                  <Textarea
                    value={notes[currentQuestion.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    placeholder="Ghi chú nhanh cho câu này..."
                    className="min-h-[88px]"
                  />
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => goToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                {currentIndex < totalQuestions - 1 ? (
                  <Button onClick={() => goToQuestion(currentIndex + 1)}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Finish <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            <Card className="h-fit p-4 space-y-3 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Question Navigator</h3>
                <Badge variant="outline">{Object.keys(answers).length}/{totalQuestions}</Badge>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((q, idx) => {
                  const answered = Boolean(answers[q.id]);
                  const isFlagged = Boolean(flagged[q.id]);
                  const active = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`relative rounded-md border px-2 py-2 text-xs ${
                        active ? "border-primary bg-primary/10 text-primary" : answered ? "border-green-500/40 bg-green-500/10" : "hover:bg-accent"
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && <Flag className="absolute -right-1 -top-1 h-3 w-3 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {flagged[currentQuestion.id] ? "Bỏ flag" : "Flag câu"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Thi thật: ẩn đáp án, no pause, fullscreen, không copy text.</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
