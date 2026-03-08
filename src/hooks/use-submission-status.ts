"use client";

import { useState, useEffect, useCallback } from "react";

type Status = "pending" | "evaluating" | "evaluated" | "error";

interface SubmissionStatus {
  status: Status;
  evaluated_at: string | null;
  errorMessage: string | null;
}

export function useSubmissionStatus(submissionId: string) {
  const [data, setData] = useState<SubmissionStatus>({
    status: "pending",
    evaluated_at: null,
    errorMessage: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/status`
      );
      if (res.ok) {
        const json = await res.json();
        setData({
          status: json.status,
          evaluated_at: json.evaluated_at,
          errorMessage: json.error_message ?? null,
        });
      }
    } catch {
      // Silently retry on next interval
    }
  }, [submissionId]);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      setData((prev) => {
        if (prev.status === "evaluated" || prev.status === "error") {
          return prev;
        }
        fetchStatus();
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return data;
}
