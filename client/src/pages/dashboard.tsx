import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, BookOpen, Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useResults } from "@/hooks/use-results";
import { useTests } from "@/hooks/use-tests";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: results = [], isLoading: isLoadingResults } = useResults();
  const { data: tests = [], isLoading: isLoadingTests } = useTests();

  const recentResults = results.slice(0, 3);
  
  // Format data for chart
  const chartData = results.slice(-5).map((r, i) => ({
    name: `Test ${i + 1}`,
    score: Math.round((r.score / r.totalQuestions) * 100)
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.firstName || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            You're on a <span className="font-bold text-orange-500">{user?.streak || 0}-day streak</span>. Keep up the great work!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-md shadow-black/5 border-none bg-gradient-to-br from-card to-blue-50/50 dark:to-blue-900/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tests Taken</p>
                <h3 className="text-2xl font-bold">{results.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md shadow-black/5 border-none bg-gradient-to-br from-card to-orange-50/50 dark:to-orange-900/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-2xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <h3 className="text-2xl font-bold">
                  {results.length > 0 
                    ? Math.round(results.reduce((acc, r) => acc + (r.score/r.totalQuestions)*100, 0) / results.length)
                    : 0}%
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md shadow-black/5 border-none bg-gradient-to-br from-card to-green-50/50 dark:to-green-900/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                <h3 className="text-2xl font-bold">{results.length * 45}m</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md shadow-black/5 border-none bg-gradient-to-br from-card to-purple-50/50 dark:to-purple-900/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Score</p>
                <h3 className="text-2xl font-bold">{user?.targetScore || "N/A"}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 shadow-lg shadow-black/5 rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Recent Performance</CardTitle>
              <CardDescription>Your score percentage over the last 5 tests</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                      <Bar dataKey="score" fill="currentColor" radius={[6, 6, 0, 0]} className="fill-primary" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No test data yet. Take a test to see your progress!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Recent */}
          <div className="space-y-8">
            <Card className="shadow-lg shadow-black/5 rounded-3xl border-border/50 bg-primary text-primary-foreground">
              <CardContent className="p-8">
                <h3 className="text-xl font-display font-bold mb-2">Bắt đầu luyện thi ngay!</h3>
                <p className="text-primary-foreground/80 mb-6">Chọn kỳ thi phù hợp và bắt đầu ôn luyện với hàng trăm đề thi chất lượng cao.</p>
                <Link href="/exams" className="w-full flex items-center justify-center gap-2 bg-white text-primary py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                  Chọn kỳ thi <ArrowRight className="w-5 h-5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Recommended</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingTests ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-muted rounded-xl"></div>
                    <div className="h-16 bg-muted rounded-xl"></div>
                  </div>
                ) : (
                  tests.slice(0, 2).map((test) => (
                    <Link key={test.id} href={`/practice/${test.id}`} className="block group">
                      <div className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between">
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">{test.title}</p>
                          <p className="text-xs text-muted-foreground">{test.category} • {test.durationMinutes} mins</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Gamification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/challenges" className="block rounded-xl border border-border/60 p-3 text-sm hover:border-primary/40 hover:bg-primary/5">
                  Daily/Weekly Challenges
                </Link>
                <Link href="/leaderboard" className="block rounded-xl border border-border/60 p-3 text-sm hover:border-primary/40 hover:bg-primary/5">
                  Leaderboard
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
