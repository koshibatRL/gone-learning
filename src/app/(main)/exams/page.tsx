import { createClient } from "@/lib/supabase/server";
import { ExamCard } from "@/components/exams/exam-card";
import type { Exam } from "@/types/database";

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">問題一覧</h1>
      {exams && exams.length > 0 ? (
        <div className="space-y-3">
          {(exams as Exam[]).map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          利用可能な問題がありません。
        </p>
      )}
    </div>
  );
}
