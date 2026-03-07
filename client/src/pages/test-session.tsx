import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTest } from "@/hooks/use-tests";
import { useSubmitResult } from "@/hooks/use-results";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Flag, Loader2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function TestSession({ id }: { id: string }) {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: test, isLoading } = useTest(id);
  const submitResult = useSubmitResult();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (test && timeLeft === 0 && !isSubmitted) {
      setTimeLeft(test.durationMinutes * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && test && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  if (isLoading || !test) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Preparing your test environment...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = test.questions[currentIndex];
  const totalQuestions = test.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelect = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    let correctCount = 0;
    
    test.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });
    
    setScore({ correct: correctCount, total: totalQuestions });
    
    if (correctCount / totalQuestions >= 0.7) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#F59E0B']
      });
    }

    if (user) {
      await submitResult.mutateAsync({
        testId: test.id,
        score: correctCount,
        totalQuestions: totalQuestions,
        answers: answers
      });
    }
  };

  if (isSubmitted) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 rounded-3xl shadow-xl text-center border-border/50">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Test Completed!</h2>
          <p className="text-muted-foreground mb-8">You scored {percentage}% on {test.title}</p>
          
          <div className="bg-muted rounded-2xl p-6 mb-8 flex justify-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Correct</p>
              <p className="text-2xl font-bold text-green-600">{score.correct}</p>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{score.total}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setLocation("/dashboard")} className="flex-1 rounded-xl h-12 text-base shadow-lg shadow-primary/20">
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/practice")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-lg">{test.title}</h1>
            <p className="text-xs text-muted-foreground">Question {currentIndex + 1} of {totalQuestions}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`font-mono text-lg font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-muted text-foreground'}`}>
            {formatTime(timeLeft)}
          </div>
          <Button 
            variant="default" 
            className="rounded-xl bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
            onClick={handleSubmit}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none bg-muted" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 flex justify-center">
        <div className="w-full max-w-3xl space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
          
          <div className="bg-card rounded-3xl p-8 sm:p-10 shadow-lg border border-border/50">
            <div className="flex items-start justify-between gap-4 mb-6">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                Q{currentIndex + 1}
              </span>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-orange-500 rounded-xl">
                <Flag className="w-4 h-4 mr-2" />
                Review Later
              </Button>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-medium leading-relaxed mb-10 text-foreground">
              {currentQuestion.text}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((opt: string, i: number) => {
                const isSelected = answers[currentQuestion.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-md scale-[1.01]" 
                        : "border-border/50 hover:border-primary/30 hover:bg-muted"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && <div className="w-3 h-3 bg-primary rounded-full" />}
                    </div>
                    <span className={`text-lg ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-xl h-14 px-6 border-2"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Previous
            </Button>
            
            {currentIndex < totalQuestions - 1 ? (
              <Button 
                size="lg" 
                className="rounded-xl h-14 px-6 shadow-md"
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="rounded-xl h-14 px-6 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20"
                onClick={handleSubmit}
              >
                Finish <CheckCircle2 className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
