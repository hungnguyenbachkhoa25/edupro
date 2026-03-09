import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { flushQueuedResults } from "@/hooks/use-results";

const OFFLINE_RESULTS_KEY = "offline-results-queue-v1";

export function NetworkIndicator() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState(0);

  const readQueued = () => {
    if (typeof window === "undefined") return 0;
    const raw = localStorage.getItem(OFFLINE_RESULTS_KEY);
    if (!raw) return 0;
    try {
      return (JSON.parse(raw) as unknown[]).length;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      setQueuedCount(readQueued());
    };
    const onOnline = async () => {
      setOnline(true);
      await flushQueuedResults();
      setQueuedCount(readQueued());
    };
    const onOffline = () => {
      setOnline(false);
      setQueuedCount(readQueued());
    };
    refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && queuedCount === 0) return null;

  return (
    <Badge variant={online ? "secondary" : "destructive"} className="gap-1">
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {online ? `Đang sync ${queuedCount} kết quả` : `Offline (${queuedCount} pending)`}
    </Badge>
  );
}
