import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertTestResult, TestResult } from "@shared/schema";

type SubmitResultPayload = InsertTestResult & {
  timeSpentSeconds?: number;
  startedAt?: string;
};

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
  return useMutation({
    mutationFn: async (data: SubmitResultPayload) => {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit result");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); // Refresh streak
    },
  });
}
