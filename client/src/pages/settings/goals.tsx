import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Target, Clock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { LearningGoal } from "@shared/schema";
import SettingsLayout from "./layout";

const EXAM_TYPES = [
  { id: "DGNL_HCM", label: "ĐGNL HCM", icon: "🎓" },
  { id: "DGNL_HN", label: "ĐGNL HN", icon: "🏛️" },
  { id: "THPTQG", label: "THPTQG", icon: "📝" },
  { id: "IELTS", label: "IELTS", icon: "🇬🇧" },
  { id: "SAT", label: "SAT", icon: "🇺🇸" },
];

export default function GoalsSettings() {
  const { toast } = useToast();
  const { data: goals, isLoading } = useQuery<LearningGoal>({
    queryKey: ["/api/settings/goals"],
  });

  const [formData, setFormData] = useState({
    examTypes: [] as string[],
    targetScores: {} as Record<string, string>,
    examDates: {} as Record<string, string>,
    dailyHours: 1.5,
  });

  useEffect(() => {
    if (goals) {
      setFormData({
        examTypes: goals.examTypes || [],
        targetScores: goals.targetScores || {},
        examDates: goals.examDates || {},
        dailyHours: goals.dailyHours || 1.5,
      });
    }
  }, [goals]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/settings/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/goals"] });
      toast({
        title: "Thành công",
        description: "Đã lưu mục tiêu học tập.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu mục tiêu học tập.",
      });
    },
  });

  const toggleExamType = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.examTypes.includes(id);
      if (isSelected) {
        return {
          ...prev,
          examTypes: prev.examTypes.filter((t) => t !== id),
        };
      } else {
        return {
          ...prev,
          examTypes: [...prev.examTypes, id],
        };
      }
    });
  };

  const handleScoreChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      targetScores: { ...prev.targetScores, [id]: value },
    }));
  };

  const handleDateChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      examDates: { ...prev.examDates, [id]: value },
    }));
  };

  const getNearestExam = () => {
    const dates = Object.entries(formData.examDates)
      .filter(([id, date]) => formData.examTypes.includes(id) && date)
      .map(([id, date]) => ({ id, date: parseISO(date) }))
      .filter((d) => d.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return dates[0];
  };

  if (isLoading) return null;

  const nearestExam = getNearestExam();
  const daysRemaining = nearestExam
    ? differenceInDays(nearestExam.date, new Date())
    : null;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Mục tiêu học tập</h3>
          <p className="text-sm text-muted-foreground">
            Thiết lập lộ trình học tập để EduPro đồng hành cùng bạn.
          </p>
        </div>

      {nearestExam && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sắp tới</p>
              <h4 className="text-lg font-bold">
                Kỳ thi {nearestExam.id} còn {daysRemaining} ngày nữa
              </h4>
              <p className="text-sm text-muted-foreground">
                Ngày thi: {format(nearestExam.date, "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Kỳ thi quan tâm
            </CardTitle>
            <CardDescription>
              Chọn các kỳ thi bạn đang ôn luyện.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {EXAM_TYPES.map((exam) => (
                <div
                  key={exam.id}
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.examTypes.includes(exam.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleExamType(exam.id)}
                  data-testid={`exam-type-${exam.id}`}
                >
                  <span className="text-2xl mb-2">{exam.icon}</span>
                  <span className="text-sm font-medium">{exam.label}</span>
                </div>
              ))}
            </div>

            {formData.examTypes.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Chi tiết mục tiêu</h4>
                {formData.examTypes.map((id) => (
                  <div key={id} className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`score-${id}`}>Mục tiêu {id}</Label>
                      <Input
                        id={`score-${id}`}
                        placeholder="VD: 7.5, 1200..."
                        value={formData.targetScores[id] || ""}
                        onChange={(e) => handleScoreChange(id, e.target.value)}
                        data-testid={`input-score-${id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`date-${id}`}>Ngày thi (Dự kiến)</Label>
                      <Input
                        id={`date-${id}`}
                        type="date"
                        value={formData.examDates[id] || ""}
                        onChange={(e) => handleDateChange(id, e.target.value)}
                        data-testid={`input-date-${id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Thời gian học mỗi ngày
            </CardTitle>
            <CardDescription>
              Bạn dự định dành bao nhiêu thời gian học trên EduPro mỗi ngày?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="pt-4">
              <Slider
                min={0.5}
                max={4}
                step={0.5}
                value={[formData.dailyHours]}
                onValueChange={([val]) => setFormData((prev) => ({ ...prev, dailyHours: val }))}
                data-testid="slider-daily-hours"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0.5h</span>
                <span>1h</span>
                <span>1.5h</span>
                <span>2h</span>
                <span>2.5h</span>
                <span>3h</span>
                <span>3.5h</span>
                <span>4h</span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">
                {formData.dailyHours} tiếng/ngày
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

        <div className="flex justify-end">
          <Button
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending}
            data-testid="button-save-goals"
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
