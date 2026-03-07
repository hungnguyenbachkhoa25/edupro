import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BreadcrumbNav } from "@/components/exam/breadcrumb-nav";
import { ExamCard } from "@/components/exam/exam-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useRoute } from "wouter";
import { MapPin, Calendar, LayoutGrid } from "lucide-react";

const regions = [
  { id: "hcm", name: "ĐHQG TP.HCM", icon: "HCM" },
  { id: "hn", name: "ĐHQG Hà Nội", icon: "HN" }
];

const mockExams = [
  { id: "1", title: "Đề thi ĐGNL ĐHQG TP.HCM - Đợt 1 2024", category: "ĐGNL", duration: 150, attempts: 1250, difficulty: "Khó" as const },
  { id: "2", title: "Đề thi ĐGNL ĐHQG TP.HCM - Đợt 2 2023", category: "ĐGNL", duration: 150, attempts: 840, difficulty: "Trung bình" as const },
  { id: "3", title: "Luyện tập tư duy định lượng - Chủ đề 1", category: "ĐGNL", duration: 60, attempts: 2100, difficulty: "Dễ" as const },
  { id: "4", title: "Đề minh họa ĐGNL 2024", category: "ĐGNL", duration: 150, attempts: 5600, difficulty: "Khó" as const },
];

export default function DgnlNav() {
  const [, params] = useRoute("/exams/dgnl/:region?/:mode?");
  const region = params?.region || "hcm";
  const mode = params?.mode || "all";

  const breadcrumbs = [
    { title: "ĐGNL", href: "/exams/dgnl" },
    ...(params?.region ? [{ title: params.region.toUpperCase(), href: `/exams/dgnl/${params.region}` }] : []),
    ...(params?.mode ? [{ title: params.mode === "years" ? "Theo năm" : "Tất cả" }] : [])
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BreadcrumbNav items={breadcrumbs} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Đánh giá năng lực</h1>
            <p className="text-muted-foreground mt-1">Hệ thống luyện đề ĐGNL đa dạng từ các vùng miền.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Khu vực
              </h3>
              <div className="space-y-2">
                {regions.map((r) => (
                  <a
                    key={r.id}
                    href={`/exams/dgnl/${r.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      region === r.id 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-card border border-border/50 hover:bg-muted hover-elevate"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${region === r.id ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                      {r.icon}
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Chế độ luyện tập
              </h3>
              <div className="space-y-2">
                <a
                  href={`/exams/dgnl/${region}/all`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    mode === "all" 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "bg-card border border-border/50 hover:bg-muted hover-elevate"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-medium">Tất cả đề thi</span>
                </a>
                <a
                  href={`/exams/dgnl/${region}/years`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    mode === "years" 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "bg-card border border-border/50 hover:bg-muted hover-elevate"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Luyện theo năm</span>
                </a>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">
                  {region === "hcm" ? "ĐHQG TP.HCM" : "ĐHQG Hà Nội"} - {mode === "years" ? "Đề theo năm" : "Danh sách đề thi"}
                </h2>
              </div>

              {mode === "years" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[2024, 2023, 2022, 2021, 2020, 2019].map((year) => (
                    <Card key={year} className="hover-elevate cursor-pointer border-border/50 group">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-xl">Năm {year}</span>
                        <span className="text-xs text-muted-foreground mt-1">4 đề thi</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={exam.title}
                      category={exam.category}
                      duration={exam.duration}
                      attempts={exam.attempts}
                      difficulty={exam.difficulty}
                      href={`/practice/${exam.id}`}
                    />
                  ))}
                </div>
              )}
            </Tabs>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
