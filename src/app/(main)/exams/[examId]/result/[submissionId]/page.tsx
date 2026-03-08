"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, ClipboardCheck, RefreshCw, ArrowLeft, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSubmissionStatus } from "@/hooks/use-submission-status";
import { GradingProgress } from "@/components/submission/grading-progress";
import { AnswerDisplay } from "@/components/submission/answer-display";
import { ResultSummary } from "@/components/results/result-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  EvaluationSection,
  EvaluationChoice,
  SubmissionResult,
} from "@/types/database";

interface ResultData {
  result: SubmissionResult;
  section: EvaluationSection;
  choice: EvaluationChoice;
}

interface AnswerInfo {
  answerText: string;
  charCount: number;
}

// Choice numbers that represent "positive" evaluations
const POSITIVE_CHOICES = new Set([11, 21, 31, 41, 51, 61, 71]);

function getInitialAnswer(submissionId: string): AnswerInfo | null {
  try {
    const cached = sessionStorage.getItem(`submission:${submissionId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { answerText: parsed.answer_text, charCount: parsed.char_count };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export default function ResultPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const examId = params.examId as string;

  const { status, errorMessage } = useSubmissionStatus(submissionId);
  const [results, setResults] = useState<ResultData[]>([]);
  // Initialize as null to avoid hydration mismatch (sessionStorage not available on server)
  const [answer, setAnswer] = useState<AnswerInfo | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Load answer: sessionStorage first, then DB fallback
  useEffect(() => {
    const cached = getInitialAnswer(submissionId);
    if (cached) {
      setAnswer(cached);
      return;
    }

    async function fetchSubmission() {
      const supabase = createClient();
      const { data: sub } = await supabase
        .from("submissions")
        .select("answer_text, char_count")
        .eq("id", submissionId)
        .single();

      if (sub) {
        setAnswer({ answerText: sub.answer_text, charCount: sub.char_count });
      }
    }

    fetchSubmission();
  }, [submissionId]);

  // Fetch results when evaluated
  useEffect(() => {
    if (status !== "evaluated") return;

    async function fetchResults() {
      const supabase = createClient();

      const { data: resultRows } = await supabase
        .from("submission_results")
        .select("*")
        .eq("submission_id", submissionId);

      if (!resultRows || resultRows.length === 0) return;

      const typedRows = resultRows as SubmissionResult[];
      const hasSnapshots = typedRows[0].choice_feedback_text !== null;

      if (hasSnapshots) {
        const mapped: ResultData[] = typedRows.map((r) => ({
          result: r,
          section: {
            id: r.section_id,
            exam_id: examId,
            section_number: r.section_number!,
            title: r.section_title!,
          },
          choice: {
            id: r.selected_choice_id,
            section_id: r.section_id,
            choice_number: r.selected_choice_number ?? 0,
            summary: r.choice_summary!,
            feedback_text: r.choice_feedback_text!,
          },
        }));
        setResults(mapped);
      } else {
        const sectionIds = typedRows.map((r) => r.section_id);
        const choiceIds = typedRows.map((r) => r.selected_choice_id);

        const [{ data: sections }, { data: choices }] = await Promise.all([
          supabase
            .from("evaluation_sections")
            .select("*")
            .in("id", sectionIds),
          supabase
            .from("evaluation_choices")
            .select("*")
            .in("id", choiceIds),
        ]);

        if (sections && choices) {
          const sectionMap = new Map(
            (sections as EvaluationSection[]).map((s) => [s.id, s])
          );
          const choiceMap = new Map(
            (choices as EvaluationChoice[]).map((c) => [c.id, c])
          );

          const mapped: ResultData[] = typedRows
            .map((r) => ({
              result: r,
              section: sectionMap.get(r.section_id)!,
              choice: choiceMap.get(r.selected_choice_id)!,
            }))
            .filter((r) => r.section && r.choice);

          setResults(mapped);
        }
      }
    }

    fetchResults();
  }, [status, submissionId, examId]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/retry`,
        { method: "POST" }
      );
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      // Ignore — user can retry again
    } finally {
      setRetrying(false);
    }
  }

  // Compute summary stats for evaluated results
  const positiveCount = results.filter((r) =>
    POSITIVE_CHOICES.has(r.choice.choice_number)
  ).length;
  const totalCount = results.length;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/exams"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        問題一覧
      </Link>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {status === "evaluated"
            ? "採点結果"
            : status === "error"
              ? "採点エラー"
              : "採点中"}
        </h1>
        {status === "evaluated" && totalCount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {positiveCount === totalCount
              ? "すべての評価項目で良好な結果です"
              : `${totalCount - positiveCount}件の改善点があります`}
          </p>
        )}
      </div>

      {/* Score summary card */}
      {status === "evaluated" && totalCount > 0 && (
        <Card className="border-none bg-primary/5">
          <CardContent className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {positiveCount}
                <span className="text-lg font-normal text-muted-foreground">
                  /{totalCount}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">良好な項目</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">
                {totalCount - positiveCount}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">改善点</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-evaluated states: single column */}
      {status !== "evaluated" && (
        <>
          {answer && (
            <AnswerDisplay
              answerText={answer.answerText}
              charCount={answer.charCount}
            />
          )}

          <Separator />

          {(status === "pending" || status === "evaluating") && (
            <GradingProgress />
          )}

          {status === "error" && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="space-y-4 py-6">
                <p className="text-sm text-destructive">
                  {errorMessage ?? "採点処理中にエラーが発生しました。"}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
                    {retrying ? "再採点中..." : "再採点する"}
                  </Button>
                  <Link href={`/exams/${examId}`}>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      答案作成に戻る
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Evaluated state: two-column layout */}
      {status === "evaluated" && (
        <>
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
            {/* Left column: answer */}
            <div className="lg:w-1/2 flex flex-col min-h-0">
              <div className="sticky top-14 z-10 bg-background pb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                あなたの答案
              </div>
              <div className="custom-scrollbar lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-2">
                {answer && (
                  <AnswerDisplay
                    answerText={answer.answerText}
                    charCount={answer.charCount}
                  />
                )}
              </div>
            </div>

            {/* Right column: evaluation */}
            <div className="lg:w-1/2 flex flex-col min-h-0">
              <div className="sticky top-14 z-10 bg-background pb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" />
                評価結果
              </div>
              <div className="custom-scrollbar lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-2">
                <ResultSummary results={results} />
              </div>
            </div>
          </div>

          {/* Navigation buttons — outside scroll area */}
          <Separator />
          <div className="flex gap-3">
            <Link href={`/exams/${examId}`}>
              <Button variant="outline" size="sm">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                もう一度挑戦
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" size="sm">提出履歴</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
