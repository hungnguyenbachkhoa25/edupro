import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useResults } from "@/hooks/use-results";
import { useTests } from "@/hooks/use-tests";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function History() {
  const { data: results = [], isLoading: isLoadingResults } = useResults();
  const { data: tests = [], isLoading: isLoadingTests } = useTests();

  const getTestTitle = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    return test?.title || "Unknown Test";
  };

  const getTestCategory = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    return test?.category || "Misc";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">History & Results</h1>
          <p className="text-muted-foreground mt-2 text-lg">Review your past performance and track improvements.</p>
        </div>

        {isLoadingResults || isLoadingTests ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 bg-muted/30 p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-bold mb-2">No history yet</h3>
            <p className="text-muted-foreground">Take your first practice test to start tracking progress.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()).map((result) => {
              const percentage = Math.round((result.score / result.totalQuestions) * 100);
              const isGood = percentage >= 70;
              
              return (
                <Card key={result.id} className="rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                        isGood ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        <span className="font-bold text-lg">{percentage}%</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{getTestTitle(result.testId)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {getTestCategory(result.testId)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.completedAt ? format(new Date(result.completedAt), "MMM d, yyyy h:mm a") : "Recent"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:w-auto w-full justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Score</p>
                        <p className="font-bold text-lg">{result.score} <span className="text-muted-foreground text-sm font-normal">/ {result.totalQuestions}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isGood ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-orange-500" />}
                        <span className={`text-sm font-medium ${isGood ? 'text-green-500' : 'text-orange-500'}`}>
                          {isGood ? "Passed" : "Needs Review"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
