"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EssayEditor } from "@/components/submission/essay-editor";
import { SubmitButton } from "@/components/submission/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Exam } from "@/types/database";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExam() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (data) {
        setExam(data as Exam);
      }
      setLoading(false);
    }
    fetchExam();
  }, [examId]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId,
          answer_text: answer,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "提出に失敗しました");
      }

      const { submission_id } = await res.json();
      sessionStorage.setItem(
        `submission:${submission_id}`,
        JSON.stringify({
          answer_text: answer,
          char_count: answer.replace(/\n/g, "").length,
        })
      );
      router.push(`/exams/${examId}/result/${submission_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提出に失敗しました");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <p className="text-sm text-muted-foreground">
        問題が見つかりませんでした。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">{exam.title}</h1>
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            出題
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{exam.prompt_text}</p>
        </CardContent>
      </Card>
      <EssayEditor
        value={answer}
        onChange={setAnswer}
        standardCharCount={exam.standard_char_count}
        disabled={submitting}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <SubmitButton
        onSubmit={handleSubmit}
        disabled={submitting}
        charCount={answer.replace(/\n/g, "").length}
      />
    </div>
  );
}
