import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BreadcrumbNav } from "@/components/exam/breadcrumb-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { GraduationCap, School, Languages, BookOpen, ArrowRight } from "lucide-react";

const examTypes = [
  {
    id: "dgnl",
    title: "Đánh giá năng lực (ĐGNL)",
    description: "Kỳ thi tuyển sinh của các Đại học Quốc gia và vùng.",
    icon: GraduationCap,
    color: "bg-blue-500",
    href: "/exams/dgnl",
    stats: "24 đề thi • 12k người học"
  },
  {
    id: "thptqg",
    title: "THPT Quốc gia",
    description: "Ôn tập kiến thức 12 và luyện đề thi tốt nghiệp.",
    icon: School,
    color: "bg-red-500",
    href: "/exams/thptqg",
    stats: "150+ đề thi • 45k người học"
  },
  {
    id: "ielts",
    title: "IELTS",
    description: "Luyện thi chứng chỉ tiếng Anh quốc tế 4 kỹ năng.",
    icon: Languages,
    color: "bg-emerald-500",
    href: "/exams/ielts",
    stats: "60 đề thi • 18k người học"
  },
  {
    id: "sat",
    title: "SAT",
    description: "Kỳ thi chuẩn hóa cho việc đăng ký vào đại học tại Hoa Kỳ.",
    icon: BookOpen,
    color: "bg-purple-500",
    href: "/exams/sat",
    stats: "12 đề thi • 5k người học"
  }
];

export default function ExamHub() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BreadcrumbNav items={[]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Kỳ thi</h1>
          <p className="text-muted-foreground mt-2">
            Chọn kỳ thi bạn muốn ôn luyện để bắt đầu lộ trình học tập.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examTypes.map((exam) => (
            <Link key={exam.id} href={exam.href}>
              <Card className="hover-elevate cursor-pointer transition-all duration-300 border-border/50 group overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-3 rounded-2xl ${exam.color} text-white shadow-lg shadow-${exam.id}/20`}>
                    <exam.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">
                      {exam.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {exam.stats}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {exam.description}
                  </p>
                  <div className="flex items-center text-primary font-semibold gap-2 group-hover:translate-x-1 transition-transform">
                    Bắt đầu ngay <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
