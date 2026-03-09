import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useResults } from "@/hooks/use-results";
import { Gift, Coins, TicketPercent, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COIN_KEY = "edupro-coin-balance-v1";

function secondsToClock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const { data: results = [] } = useResults();
  const { toast } = useToast();
  const [coins, setCoins] = useState(0);
  const [voucher, setVoucher] = useState("");
  const [giftTarget, setGiftTarget] = useState("");
  const [flashLeft, setFlashLeft] = useState(24 * 3600);
  const [eduEmail, setEduEmail] = useState("");

  const isFree = user?.plan === "free";
  const usedFreeTests = results.length;
  const showPaywall = isFree && usedFreeTests >= 3;

  useEffect(() => {
    const raw = localStorage.getItem(COIN_KEY);
    setCoins(raw ? Number(raw) : 0);
  }, []);

  useEffect(() => {
    localStorage.setItem(COIN_KEY, String(coins));
  }, [coins]);

  useEffect(() => {
    const timer = setInterval(() => setFlashLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const pricing = useMemo(() => {
    const monthly = 199000;
    const annual = Math.round(monthly * 12 * 0.6);
    const saved = monthly * 12 - annual;
    return { monthly, annual, saved };
  }, []);

  const spend = (cost: number, item: string) => {
    if (coins < cost) {
      toast({ variant: "destructive", title: "Không đủ coins", description: `Cần ${cost} coins cho ${item}` });
      return;
    }
    setCoins((prev) => prev - cost);
    toast({ title: "Đã mua thành công", description: `${item} đã được mở khóa.` });
  };

  const applyVoucher = () => {
    if (voucher.toUpperCase() === "EDUPRO30") {
      toast({ title: "Voucher hợp lệ", description: "Giảm 30% đã được áp dụng." });
    } else {
      toast({ variant: "destructive", title: "Voucher không hợp lệ" });
    }
  };

  const verifyEduDiscount = () => {
    if (eduEmail.endsWith(".edu.vn")) {
      toast({ title: "Xác minh thành công", description: "Bạn nhận student discount 30%." });
    } else {
      toast({ variant: "destructive", title: "Email chưa hợp lệ", description: "Vui lòng dùng email trường học (.edu.vn)." });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Monetization Features</h1>
          <p className="text-muted-foreground mt-2">Gói nâng cấp, coins, gift/voucher và flash sale.</p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Pricing & Paywall</TabsTrigger>
            <TabsTrigger value="coins">Coins Economy</TabsTrigger>
            <TabsTrigger value="gift">Gift & Voucher</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4 pt-4">
            {showPaywall && (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <CardTitle>Mở khóa không giới hạn</CardTitle>
                  <CardDescription>Bạn đã dùng {usedFreeTests} đề miễn phí. Nâng cấp để tiếp tục luyện đề không giới hạn.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button>Start Pro Trial 7 ngày</Button>
                  <Button variant="outline">Xem gói Annual tiết kiệm 40%</Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pro Monthly</CardTitle>
                  <CardDescription>Trả theo tháng, hủy bất cứ lúc nào.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-bold">{pricing.monthly.toLocaleString()}đ</p>
                  <p className="text-sm text-muted-foreground">Trial 7 ngày cho user mới (thêm thẻ, chưa charge ngay).</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Pro Annual <Badge>Best value</Badge></CardTitle>
                  <CardDescription>Giảm 40% so với trả theo tháng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-bold">{pricing.annual.toLocaleString()}đ/năm</p>
                  <p className="text-sm text-emerald-500">Tiết kiệm {pricing.saved.toLocaleString()}đ</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student discount 30%</CardTitle>
                <CardDescription>Xác minh email trường học .edu.vn</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Input value={eduEmail} onChange={(e) => setEduEmail(e.target.value)} placeholder="your-name@school.edu.vn" className="max-w-sm" />
                <Button variant="outline" onClick={verifyEduDiscount}>Xác minh</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Coin balance</CardTitle>
                <CardDescription>Tích coins từ học tập: làm bài, streak, daily challenge, referral.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold">{coins} coins</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setCoins((prev) => prev + 30)}>+30 (làm bài)</Button>
                  <Button variant="outline" onClick={() => setCoins((prev) => prev + 50)} className="gap-1"><Flame className="h-4 w-4" /> +50 (streak)</Button>
                  <Button variant="outline" onClick={() => setCoins((prev) => prev + 80)}>+80 (daily challenge)</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader><CardTitle className="text-base">Streak Freeze</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Bảo vệ streak 1 ngày.</p>
                  <Button onClick={() => spend(120, "Streak Freeze")}>Mua 120 coins</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Hint câu khó</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mở hint nâng cao.</p>
                  <Button onClick={() => spend(40, "Hint")} variant="outline">Mua 40 coins</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Avatar frame</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Đổi khung avatar theo mùa.</p>
                  <Button onClick={() => spend(250, "Avatar frame")} variant="secondary">Mua 250 coins</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gift" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Gift Pro</CardTitle>
                  <CardDescription>Tặng gói Pro cho bạn bè.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Email hoặc username người nhận</Label>
                  <Input value={giftTarget} onChange={(e) => setGiftTarget(e.target.value)} placeholder="friend@example.com" />
                  <Button onClick={() => toast({ title: "Đã tạo gift purchase", description: `Gói Pro đã sẵn sàng tặng cho ${giftTarget || "người nhận"}.` })}>
                    Tạo gift
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TicketPercent className="h-5 w-5 text-primary" /> Voucher code</CardTitle>
                  <CardDescription>Voucher từ trường học / đối tác.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="Nhập mã voucher..." />
                  <Button variant="outline" onClick={applyVoucher}>Áp dụng voucher</Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle>Flash Sale 24h</CardTitle>
                <CardDescription>Ưu đãi giới hạn thời gian.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm">Thời gian còn lại</p>
                <p className="text-2xl font-bold text-amber-500">{secondsToClock(flashLeft)}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
