import { createClient } from "@/lib/supabase/server";
import { ExamCard } from "@/components/exams/exam-card";
import { FileText } from "lucide-react";
import type { Exam } from "@/types/database";

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">問題一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          論文問題を選択して、模擬採点を受けましょう
        </p>
      </div>
      {exams && exams.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(exams as Exam[]).map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">利用可能な問題がありません</p>
          <p className="text-sm text-muted-foreground">
            管理者が問題を追加するまでお待ちください。
          </p>
        </div>
      )}
    </div>
  );
}
