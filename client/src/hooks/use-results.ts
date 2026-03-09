import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertTestResult, TestResult } from "@shared/schema";

type SubmitResultPayload = InsertTestResult & {
  timeSpentSeconds?: number;
  startedAt?: string;
};

const OFFLINE_RESULTS_KEY = "offline-results-queue-v1";

type OfflineQueuedResult = SubmitResultPayload & {
  queuedAt: string;
};

function readOfflineQueue(): OfflineQueuedResult[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(OFFLINE_RESULTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineQueuedResult[];
  } catch {
    return [];
  }
}

function writeOfflineQueue(list: OfflineQueuedResult[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(list));
}

export async function flushQueuedResults(): Promise<number> {
  const queue = readOfflineQueue();
  if (queue.length === 0) return 0;

  let flushed = 0;
  const remain: OfflineQueuedResult[] = [];
  for (const item of queue) {
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      if (!res.ok) {
        remain.push(item);
      } else {
        flushed += 1;
      }
    } catch {
      remain.push(item);
    }
  }
  writeOfflineQueue(remain);
  return flushed;
}

export function useResults() {
  return useQuery({
    queryKey: ["/api/results"],
    queryFn: async (): Promise<TestResult[]> => {
      const res = await fetch("/api/results", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onOnline = async () => {
      const flushed = await flushQueuedResults();
      if (flushed > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [queryClient]);

  return useMutation({
    mutationFn: async (data: SubmitResultPayload) => {
      const optimisticResult: TestResult = {
        id: `offline-${Date.now()}`,
        userId: "current-user",
        testId: data.testId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        answers: data.answers,
        completedAt: new Date(),
      };

      if (!navigator.onLine) {
        writeOfflineQueue([...readOfflineQueue(), { ...data, queuedAt: new Date().toISOString() }]);
        return optimisticResult;
      }

      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to submit result");
        return res.json();
      } catch (_error) {
        writeOfflineQueue([...readOfflineQueue(), { ...data, queuedAt: new Date().toISOString() }]);
        return optimisticResult;
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["/api/results"] });
      const previous = queryClient.getQueryData<TestResult[]>(["/api/results"]) || [];
      const optimisticResult: TestResult = {
        id: `optimistic-${Date.now()}`,
        userId: "current-user",
        testId: data.testId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        answers: data.answers,
        completedAt: new Date(),
      };
      queryClient.setQueryData<TestResult[]>(["/api/results"], [optimisticResult, ...previous]);
      return { previous };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/results"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); // Refresh streak
    },
  });
}
