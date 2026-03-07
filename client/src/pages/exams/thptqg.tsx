import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BreadcrumbNav } from "@/components/exam/breadcrumb-nav";
import { ExamCard } from "@/components/exam/exam-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useRoute } from "wouter";
import { BookMarked, GraduationCap, ChevronRight } from "lucide-react";

const subjects = [
  { id: "toan", name: "Toán học", color: "bg-red-500", icon: "T" },
  { id: "van", name: "Ngữ văn", color: "bg-orange-500", icon: "V" },
  { id: "anh", name: "Tiếng Anh", color: "bg-green-500", icon: "A" },
  { id: "ly", name: "Vật lý", color: "bg-blue-500", icon: "L" },
  { id: "hoa", name: "Hóa học", color: "bg-purple-500", icon: "H" },
  { id: "sinh", name: "Sinh học", color: "bg-emerald-500", icon: "S" },
  { id: "su", name: "Lịch sử", color: "bg-yellow-600", icon: "S" },
  { id: "dia", name: "Địa lý", color: "bg-cyan-600", icon: "Đ" },
  { id: "gdcd", name: "GDCD", color: "bg-pink-500", icon: "G" },
];

const mockExams = [
  { id: "thpt-1", title: "Đề thi chính thức THPT QG 2023 - Mã đề 101", category: "THPTQG", duration: 90, attempts: 4500, difficulty: "Khó" as const },
  { id: "thpt-2", title: "Đề minh họa THPT QG 2024", category: "THPTQG", duration: 90, attempts: 8900, difficulty: "Trung bình" as const },
  { id: "thpt-3", title: "Đề thi thử chuyên Hùng Vương - Phú Thọ", category: "THPTQG", duration: 90, attempts: 1200, difficulty: "Khó" as const },
  { id: "thpt-4", title: "Luyện tập 15 phút - Chuyên đề Hàm số", category: "THPTQG", duration: 15, attempts: 12000, difficulty: "Dễ" as const },
];

export default function ThptqgNav() {
  const [, params] = useRoute("/exams/thptqg/:subject?");
  const currentSubjectId = params?.subject;
  const currentSubject = subjects.find(s => s.id === currentSubjectId);

  const breadcrumbs = [
    { title: "THPT Quốc gia", href: "/exams/thptqg" },
    ...(currentSubject ? [{ title: currentSubject.name }] : [])
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BreadcrumbNav items={breadcrumbs} />

        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">THPT Quốc gia</h1>
          <p className="text-muted-foreground mt-1">Luyện tập theo từng môn học và đề thi tốt nghiệp các năm.</p>
        </div>

        {!currentSubjectId || !currentSubject ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {subjects.map((subject) => (
              <a key={subject.id} href={`/exams/thptqg/${subject.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all border-border/50 group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-2xl ${subject.color} text-white flex items-center justify-center font-bold text-xl mb-3 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                      {subject.icon}
                    </div>
                    <span className="font-bold text-base">{subject.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">45+ đề thi</span>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-card border border-border/50">
              <div className={`w-16 h-16 rounded-2xl ${currentSubject.color} text-white flex items-center justify-center font-bold text-2xl shadow-lg`}>
                {currentSubject.icon}
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Môn {currentSubject.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><BookMarked className="w-4 h-4" /> 12 chuyên đề</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> 4.5k học sinh</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="exams" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="exams" className="rounded-lg">Đề thi luyện tập</TabsTrigger>
                <TabsTrigger value="topics" className="rounded-lg">Theo chuyên đề</TabsTrigger>
              </TabsList>
              
              <TabsContent value="exams" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={`${exam.title} - ${currentSubject.name}`}
                      category={exam.category}
                      duration={exam.duration}
                      attempts={exam.attempts}
                      difficulty={exam.difficulty}
                      href={`/practice/${exam.id}`}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="topics" className="mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="hover-elevate cursor-pointer border-border/50 group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            {i}
                          </div>
                          <div>
                            <p className="font-semibold group-hover:text-primary transition-colors">Chuyên đề {i}: Nội dung trọng tâm thi THPT</p>
                            <p className="text-xs text-muted-foreground">250 câu hỏi • 3 bài thi thử</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
