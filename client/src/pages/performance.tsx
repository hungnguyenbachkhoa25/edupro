import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { flushQueuedResults } from "@/hooks/use-results";
import { Activity, Accessibility, WifiOff, RefreshCcw } from "lucide-react";
import { io, Socket } from "socket.io-client";

const OFFLINE_RESULTS_KEY = "offline-results-queue-v1";

export default function PerformancePage() {
  const { toast } = useToast();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [cachedTests, setCachedTests] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncState, setSyncState] = useState("idle");
  const [socketConnected, setSocketConnected] = useState(false);

  const [highContrast, setHighContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [items, setItems] = useState(Array.from({ length: 24 }).map((_, i) => `Bộ đề #${i + 1}`));
  const [virtualStart, setVirtualStart] = useState(0);
  const virtualRef = useRef<HTMLDivElement>(null);
  const infiniteRef = useRef<HTMLDivElement>(null);

  const virtualRows = useMemo(() => {
    const size = 14;
    return items.slice(virtualStart, virtualStart + size).map((name, idx) => ({
      id: `${virtualStart + idx}`,
      name,
    }));
  }, [items, virtualStart]);

  const readPending = () => {
    const raw = localStorage.getItem(OFFLINE_RESULTS_KEY);
    if (!raw) return 0;
    try {
      return (JSON.parse(raw) as unknown[]).length;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    setPendingSync(readPending());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      query: { userId: "performance-monitor" },
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle("dyslexia-font", dyslexia);
  }, [dyslexia]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setItems((prev) => {
          if (prev.length >= 120) return prev;
          const nextCount = prev.length;
          const more = Array.from({ length: 16 }).map((_, i) => `Bộ đề #${nextCount + i + 1}`);
          return [...prev, ...more];
        });
      }
    }, { rootMargin: "180px" });

    if (infiniteRef.current) observer.observe(infiniteRef.current);
    return () => observer.disconnect();
  }, []);

  const simulateOfflineCache = () => {
    setCachedTests((prev) => prev + 12);
    toast({ title: "Đã cache đề thi offline", description: "Bạn có thể làm đề khi mất mạng." });
  };

  const syncNow = async () => {
    setSyncState("syncing");
    const flushed = await flushQueuedResults();
    setPendingSync(readPending());
    setSyncState("idle");
    toast({ title: "Sync hoàn tất", description: `Đã sync ${flushed} kết quả offline.` });
  };

  const optimisticSave = () => {
    setSavedState("saving");
    setTimeout(() => {
      const ok = Math.random() > 0.25;
      setSavedState(ok ? "saved" : "error");
      if (!ok) {
        toast({ variant: "destructive", title: "Rollback", description: "Lưu thất bại, UI đã rollback." });
      }
    }, 700);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Performance & Technical</h1>
          <p className="text-muted-foreground mt-2">Offline mode, sync đa thiết bị, accessibility và tối ưu UX.</p>
        </div>

        <Tabs defaultValue="offline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="offline">Offline/PWA</TabsTrigger>
            <TabsTrigger value="sync">Multi-device sync</TabsTrigger>
            <TabsTrigger value="a11y">Accessibility</TabsTrigger>
            <TabsTrigger value="ux">Speed & UX</TabsTrigger>
          </TabsList>

          <TabsContent value="offline" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><WifiOff className="h-5 w-5 text-primary" /> Offline mode</CardTitle>
                <CardDescription>Tải trước đề thi, làm offline, tự sync khi online.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={online ? "secondary" : "destructive"}>{online ? "Online" : "Offline"}</Badge>
                  <Badge variant="outline">{cachedTests} đề đã cache</Badge>
                  <Badge variant="outline">{pendingSync} kết quả chờ sync</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={simulateOfflineCache}>Cache 12 đề offline</Button>
                  <Button variant="outline" onClick={syncNow} className="gap-1"><RefreshCcw className="h-4 w-4" /> Sync ngay</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-device Sync</CardTitle>
                <CardDescription>Bắt đầu trên desktop, tiếp tục trên mobile khi online.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="text-sm">Trạng thái realtime socket: <strong>{socketConnected ? "Connected" : "Disconnected"}</strong></p>
                  <p className="text-sm text-muted-foreground">Last sync: {new Date().toLocaleTimeString("vi-VN")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm">Tiến trình bài thi sẽ được gửi theo từng câu (WebSocket), thiết bị khác nhận tức thì.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="a11y" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Accessibility className="h-5 w-5 text-primary" /> Accessibility controls</CardTitle>
                <CardDescription>Screen reader support, high contrast, dyslexia font, điều chỉnh cỡ chữ.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} id="hc" />
                  <Label htmlFor="hc">High contrast mode</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={dyslexia} onChange={(e) => setDyslexia(e.target.checked)} id="dy" />
                  <Label htmlFor="dy">Dyslexia-friendly font</Label>
                </div>
                <div className="space-y-2">
                  <Label>Cỡ chữ toàn trang: {fontScale}%</Label>
                  <Input type="range" min={85} max={130} value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ux" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Skeleton loading</CardTitle>
                  <CardDescription>Dùng skeleton thay vì spinner khi load danh sách.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="animate-pulse rounded-lg border p-3">
                      <div className="h-3 w-40 rounded bg-muted" />
                      <div className="mt-2 h-2 w-56 rounded bg-muted" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimistic UI</CardTitle>
                  <CardDescription>Hiện saved ngay, rollback nếu lỗi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={optimisticSave}>Lưu thay đổi</Button>
                  <Badge variant={savedState === "error" ? "destructive" : "secondary"}>
                    {savedState === "idle" ? "Chưa lưu" : savedState === "saving" ? "Đang lưu..." : savedState === "saved" ? "Saved" : "Rollback"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Infinite scroll + Virtual list</CardTitle>
                <CardDescription>Danh sách đề dài dùng load dần và render theo viewport.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="max-h-[340px] space-y-2 overflow-y-auto rounded-lg border p-3">
                  {items.map((item) => (
                    <div key={item} className="rounded border p-2 text-sm">{item}</div>
                  ))}
                  <div ref={infiniteRef} className="py-2 text-center text-xs text-muted-foreground">Đang tải thêm...</div>
                </div>

                <div
                  ref={virtualRef}
                  className="max-h-[340px] overflow-y-auto rounded-lg border p-3"
                  onScroll={(e) => {
                    const top = e.currentTarget.scrollTop;
                    const idx = Math.floor(top / 36);
                    setVirtualStart(Math.max(0, Math.min(items.length - 1, idx)));
                  }}
                >
                  <div style={{ height: `${items.length * 36}px`, position: "relative" }}>
                    {virtualRows.map((row, i) => (
                      <div
                        key={row.id}
                        className="absolute left-0 right-0 rounded border bg-background px-2 py-1 text-sm"
                        style={{ top: `${(virtualStart + i) * 36}px` }}
                      >
                        {row.name}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
