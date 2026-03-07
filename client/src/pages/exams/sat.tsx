import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BreadcrumbNav } from "@/components/exam/breadcrumb-nav";
import { ExamCard } from "@/components/exam/exam-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute } from "wouter";
import { BookOpen, Calculator, Info, FileText } from "lucide-react";

const sections = [
  { 
    id: "reading-writing", 
    name: "Reading & Writing", 
    icon: BookOpen, 
    description: "54 questions in 64 minutes. Focuses on craft, structure, ideas, and standard English conventions."
  },
  { 
    id: "math", 
    name: "Math", 
    icon: Calculator, 
    description: "44 questions in 70 minutes. Algebra, Advanced Math, Problem Solving, Geometry, and Trigonometry."
  },
];

const mockExams = [
  { id: "sat-1", title: "Digital SAT Practice Test 1", category: "SAT", duration: 134, attempts: 2100, difficulty: "Khó" as const },
  { id: "sat-2", title: "Bluebook Adaptive Test - Module 1", category: "SAT", duration: 35, attempts: 4200, difficulty: "Trung bình" as const },
  { id: "sat-3", title: "Math Drill: Heart of Algebra", category: "SAT", duration: 25, attempts: 5600, difficulty: "Dễ" as const },
];

export default function SatNav() {
  const [, params] = useRoute("/exams/sat/:section?");
  const activeSection = params?.section || "reading-writing";

  const breadcrumbs = [
    { title: "SAT", href: "/exams/sat" },
    { title: activeSection === "math" ? "Math" : "Reading & Writing" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BreadcrumbNav items={breadcrumbs} />

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">SAT Prep</h1>
            <p className="text-muted-foreground mt-1">Luyện tập kỳ thi chuẩn hóa SAT Digital mới nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`/exams/sat/${section.id}`}
                className={`group relative overflow-hidden p-6 rounded-3xl border transition-all hover-elevate ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${activeSection === section.id ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                    <section.icon className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Section</span>
                    <h3 className="text-xl font-display font-bold">{section.name}</h3>
                  </div>
                </div>
                <p className={`mt-4 text-sm ${activeSection === section.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {section.description}
                </p>
                <div className={`mt-6 flex items-center gap-2 font-semibold ${activeSection === section.id ? "text-white" : "text-primary"}`}>
                  Luyện tập <div className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center">
                    <FileText className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold">Đề thi & Bài tập</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  id={exam.id}
                  title={`${exam.title} - ${activeSection === "math" ? "Math" : "R&W"}`}
                  category={exam.category}
                  duration={exam.duration}
                  attempts={exam.attempts}
                  difficulty={exam.difficulty}
                  href={`/practice/${exam.id}`}
                />
              ))}
            </div>
          </div>

          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Info className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Bạn đã biết về SAT Digital?</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Kỳ thi SAT hiện đã chuyển hoàn toàn sang hình thức thi trên máy tính với cấu trúc đề thích ứng (adaptive). 
                  Hãy làm các bài thi thử để làm quen với giao diện và tốc độ làm bài.
                </p>
              </div>
              <Button variant="outline">Tìm hiểu thêm</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
