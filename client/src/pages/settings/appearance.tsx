import { useState, useEffect } from "react";
  import { useAuth } from "@/hooks/use-auth";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
  import { Sun, Moon, Monitor, Type, Languages, Palette, Check } from "lucide-react";
  import { apiRequest, queryClient } from "@/lib/queryClient";
  import { useToast } from "@/hooks/use-toast";
  import { DashboardLayout } from "@/components/layout/dashboard-layout";
  import { cn } from "@/lib/utils";

  const appearanceSchema = z.object({
    theme: z.enum(["light", "dark", "system"]),
    fontSize: z.enum(["small", "medium", "large"]),
    accentColor: z.string(),
    language: z.enum(["vi", "en"]),
  });

  type AppearanceFormValues = z.infer<typeof appearanceSchema>;

  const ACCENT_COLORS = [
    { name: "Blue", value: "#2563EB", class: "bg-[#2563EB]" },
    { name: "Green", value: "#16a34a", class: "bg-[#16a34a]" },
    { name: "Purple", value: "#7c3aed", class: "bg-[#7c3aed]" },
    { name: "Orange", value: "#ea580c", class: "bg-[#ea580c]" },
    { name: "Red", value: "#dc2626", class: "bg-[#dc2626]" },
    { name: "Teal", value: "#0d9488", class: "bg-[#0d9488]" },
  ];

  export default function AppearanceSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);

    const form = useForm<AppearanceFormValues>({
      resolver: zodResolver(appearanceSchema),
      defaultValues: {
        theme: (user?.theme as any) || "system",
        fontSize: (user?.fontSize as any) || "medium",
        accentColor: user?.accentColor || "#2563EB",
        language: (user?.language as any) || "vi",
      },
    });

    const { isDirty } = form.formState;

    // Real-time preview effect
    const watchedTheme = form.watch("theme");
    const watchedFontSize = form.watch("fontSize");
    const watchedAccentColor = form.watch("accentColor");

    useEffect(() => {
      const root = window.document.documentElement;
      
      // Preview theme
      root.classList.remove("light", "dark");
      if (watchedTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(watchedTheme);
      }

      // Preview font size
      root.style.fontSize = "";
      if (watchedFontSize === "small") root.style.fontSize = "14px";
      else if (watchedFontSize === "large") root.style.fontSize = "18px";
      else root.style.fontSize = "16px";

      // Preview accent color
      const hexToHSL = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
          r = parseInt(hex.substring(1, 3), 16);
          g = parseInt(hex.substring(3, 5), 16);
          b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return (h * 360).toFixed(1) + " " + (s * 100).toFixed(1) + "% " + (l * 100).toFixed(1) + "%";
      };
      
      const hsl = hexToHSL(watchedAccentColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);

      // Cleanup: revert to user's actual settings if we leave or before next run
      return () => {
        // This is handled by useUserPreferences hook generally, but good to be safe
      };
    }, [watchedTheme, watchedFontSize, watchedAccentColor]);

    async function onSubmit(values: AppearanceFormValues) {
      setIsPending(true);
      try {
        await apiRequest("PATCH", "/api/settings/appearance", values);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Thành công",
          description: "Cài đặt giao diện đã được lưu.",
        });
        form.reset(values);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể lưu cài đặt. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setIsPending(false);
      }
    }

    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Giao diện</h1>
            <p className="text-muted-foreground">
              Tùy chỉnh trải nghiệm học tập của bạn.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Chế độ hiển thị
                  </CardTitle>
                  <CardDescription>
                    Chọn giao diện sáng hoặc tối cho ứng dụng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="light" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                field.value === "light" && "border-primary"
                              )}>
                                <Sun className="mb-3 h-6 w-6" />
                                <span className="text-sm font-medium">Sáng</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="dark" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                field.value === "dark" && "border-primary"
                              )}>
                                <Moon className="mb-3 h-6 w-6" />
                                <span className="text-sm font-medium">Tối</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="system" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                field.value === "system" && "border-primary"
                              )}>
                                <Monitor className="mb-3 h-6 w-6" />
                                <span className="text-sm font-medium">Hệ thống</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Kích thước chữ
                  </CardTitle>
                  <CardDescription>
                    Điều chỉnh kích thước phông chữ để đọc dễ dàng hơn.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="small" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Nhỏ (14px)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="medium" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Vừa (16px)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="large" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Lớn (18px)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm font-medium mb-1">Bản xem trước văn bản</p>
                    <p className="text-muted-foreground leading-relaxed">
                      EduPro cung cấp lộ trình học tập tối ưu, giúp bạn chinh phục mọi kỳ thi quan trọng. Trải nghiệm học tập cá nhân hóa ngay hôm nay.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Màu chủ đạo
                  </CardTitle>
                  <CardDescription>
                    Chọn màu nhấn cho các nút và các thành phần chính.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-wrap gap-3">
                            {ACCENT_COLORS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => field.onChange(color.value)}
                                className={cn(
                                  "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                  color.class,
                                  field.value === color.value ? "ring-2 ring-offset-2 ring-foreground" : "opacity-80 hover:opacity-100"
                                )}
                                title={color.name}
                                data-testid={"button-color-" + color.name.toLowerCase()}
                              >
                                {field.value === color.value && <Check className="h-5 w-5 text-white" />}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Ngôn ngữ
                  </CardTitle>
                  <CardDescription>
                    Chọn ngôn ngữ hiển thị của ứng dụng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="vi" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Tiếng Việt
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="en" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                English
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!isDirty || isPending}
                  data-testid="button-save-appearance"
                >
                  {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DashboardLayout>
    );
  }
  