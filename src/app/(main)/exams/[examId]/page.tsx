"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EssayEditor } from "@/components/submission/essay-editor";
import { SubmitButton } from "@/components/submission/submit-button";
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
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm font-medium">問題が見つかりませんでした</p>
        <Link
          href="/exams"
          className="text-sm text-primary underline underline-offset-4"
        >
          問題一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/exams"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          問題一覧
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{exam.title}</h1>
      </div>

      <div className="rounded-lg bg-primary/[0.03] px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary/60">
          <BookOpen className="h-3.5 w-3.5" />
          出題
        </div>
        <p className="text-base leading-relaxed text-foreground/90">
          {exam.prompt_text}
        </p>
      </div>

      <EssayEditor
        value={answer}
        onChange={setAnswer}
        standardCharCount={exam.standard_char_count}
        disabled={submitting}
      />

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <SubmitButton
        onSubmit={handleSubmit}
        disabled={submitting}
        charCount={answer.replace(/\n/g, "").length}
      />
    </div>
  );
}
