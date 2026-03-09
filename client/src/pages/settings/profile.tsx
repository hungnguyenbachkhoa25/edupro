import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SettingsLayout from "./layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "Vui lòng nhập họ"),
  lastName: z.string().min(1, "Vui lòng nhập tên"),
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự").max(30, "Username tối đa 30 ký tự").nullable(),
  bio: z.string().max(200, "Giới thiệu tối đa 200 ký tự").nullable(),
  school: z.string().max(100, "Tên trường tối đa 100 ký tự").nullable(),
  province: z.string().max(50, "Tên tỉnh tối đa 50 ký tự").nullable(),
  birthDate: z.string().nullable(),
  gender: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      bio: user?.bio || "",
      school: user?.school || "",
      province: user?.province || "",
      birthDate: user?.birthDate || "",
      gender: user?.gender || "other",
      profileImageUrl: user?.profileImageUrl || "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      bio: user.bio || "",
      school: user.school || "",
      province: user.province || "",
      birthDate: user.birthDate || "",
      gender: user.gender || "other",
      profileImageUrl: user.profileImageUrl || "",
    });
    setPreviewImage(user.profileImageUrl || null);
  }, [user, form]);

  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/settings/profile", values);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Thành công",
        description: "Thông tin cá nhân đã được cập nhật.",
      });
      form.reset({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        username: updatedUser.username || "",
        bio: updatedUser.bio || "",
        school: updatedUser.school || "",
        province: updatedUser.province || "",
        birthDate: updatedUser.birthDate || "",
        gender: updatedUser.gender || "other",
        profileImageUrl: updatedUser.profileImageUrl || "",
      });
      setPreviewImage(updatedUser.profileImageUrl || null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 2MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        try {
          const uploadRes = await apiRequest("POST", "/api/upload", { dataUrl: base64String });
          const upload = await uploadRes.json();
          form.setValue("profileImageUrl", upload.url, { shouldDirty: true });
          setPreviewImage(upload.url);
        } catch (_error) {
          toast({
            title: "Lỗi",
            description: "Không thể tải ảnh lên. Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const bioContent = form.watch("bio") || "";

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
          <p className="text-sm text-muted-foreground">
            Cập nhật thông tin cơ bản và ảnh đại diện của bạn.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-8">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-primary/20">
                  <AvatarImage src={previewImage || user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="button-upload-avatar"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <h4 className="font-medium">Ảnh đại diện</h4>
                <p className="text-xs text-muted-foreground">
                  Chấp nhận JPG, PNG hoặc WebP. Tối đa 2MB.
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-select-image"
                >
                  Thay đổi ảnh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn" {...field} data-testid="input-firstname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Văn A" {...field} data-testid="input-lastname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username / Biệt danh</FormLabel>
                  <FormControl>
                    <Input placeholder="nguyenvana" {...field} value={field.value || ""} data-testid="input-username" />
                  </FormControl>
                  <FormDescription>
                    Đây là tên hiển thị công khai của bạn.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input value={user?.email || ""} disabled className="bg-muted" data-testid="input-email-readonly" />
              </FormControl>
              <FormDescription>
                Email hiện tại của tài khoản.
              </FormDescription>
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} data-testid="input-birthdate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "other"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác / Không muốn tiết lộ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trường học</FormLabel>
                    <FormControl>
                      <Input placeholder="THPT Chuyên..." {...field} value={field.value || ""} data-testid="input-school" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tỉnh / Thành phố</FormLabel>
                    <FormControl>
                      <Input placeholder="Hà Nội" {...field} value={field.value || ""} data-testid="input-province" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giới thiệu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Chia sẻ đôi chút về bản thân..." 
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-bio"
                    />
                  </FormControl>
                  <div className="flex justify-end mt-1">
                    <span className={cn("text-xs", bioContent.length > 200 ? "text-destructive" : "text-muted-foreground")}>
                      {bioContent.length}/200
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={!form.formState.isDirty || updateProfile.isPending}
              data-testid="button-save-profile"
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </form>
        </Form>
      </div>
    </SettingsLayout>
  );
}
