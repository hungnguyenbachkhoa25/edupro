import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BreadcrumbNav } from "@/components/exam/breadcrumb-nav";
import { ExamCard } from "@/components/exam/exam-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoute } from "wouter";
import { Headphones, BookOpen, PenTool, Mic2, Star, Clock } from "lucide-react";

const skills = [
  { id: "listening", name: "Listening", icon: Headphones, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "reading", name: "Reading", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "writing", name: "Writing", icon: PenTool, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "speaking", name: "Speaking", icon: Mic2, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const mockExams = [
  { id: "ielts-1", title: "IELTS Academic Practice Test 1", category: "IELTS", duration: 60, attempts: 3200, difficulty: "Khó" as const },
  { id: "ielts-2", title: "IELTS General Training - Section 1", category: "IELTS", duration: 30, attempts: 1500, difficulty: "Trung bình" as const },
  { id: "ielts-3", title: "Vocabulary for IELTS - Topic: Education", category: "IELTS", duration: 15, attempts: 5400, difficulty: "Dễ" as const },
];

export default function IeltsNav() {
  const [, params] = useRoute("/exams/ielts/:skill?");
  const activeSkill = params?.skill || "listening";

  const breadcrumbs = [
    { title: "IELTS", href: "/exams/ielts" },
    { title: activeSkill.charAt(0).toUpperCase() + activeSkill.slice(1) }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BreadcrumbNav items={breadcrumbs} />

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">IELTS Practice</h1>
              <p className="text-muted-foreground mt-1">Luyện tập 4 kỹ năng chuẩn Cambridge.</p>
            </div>

            <Tabs value={activeSkill} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
                {skills.map((skill) => (
                  <TabsTrigger
                    key={skill.id}
                    value={skill.id}
                    asChild
                  >
                    <a
                      href={`/exams/ielts/${skill.id}`}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all data-[state=active]:shadow-lg ${
                        activeSkill === skill.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border/50 hover:bg-muted"
                      }`}
                    >
                      <skill.icon className="w-5 h-5" />
                      {skill.name}
                    </a>
                  </TabsTrigger>
                ))}
              </TabsList>

              {skills.map((skill) => (
                <TabsContent key={skill.id} value={skill.id} className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mockExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        id={exam.id}
                        title={`${exam.title} (${skill.name})`}
                        category={exam.category}
                        duration={exam.duration}
                        attempts={exam.attempts}
                        difficulty={exam.difficulty}
                        href={`/practice/${exam.id}`}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <aside className="w-full md:w-80 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-display">Target Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="font-bold text-primary">6.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Goal</span>
                  <span className="font-bold text-primary">7.5</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-[75%]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  You need more practice in Writing and Speaking to reach your goal.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" /> Tips for {activeSkill}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-muted-foreground">
                <div className="flex gap-3">
                  <div className="min-w-[4px] rounded-full bg-primary" />
                  <p>Read the questions carefully before the audio starts.</p>
                </div>
                <div className="flex gap-3">
                  <div className="min-w-[4px] rounded-full bg-primary" />
                  <p>Pay attention to plural endings and spelling.</p>
                </div>
                <div className="flex gap-3">
                  <div className="min-w-[4px] rounded-full bg-primary" />
                  <p>Don't spend too much time on one question.</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
