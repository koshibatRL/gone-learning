import { createClient } from "@/lib/supabase/server";
import { HistoryTable } from "@/components/history/history-table";
import { Clock } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, exam_id, char_count, status, submitted_at, exams(title)")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  const items = (submissions ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    exam_id: s.exam_id as string,
    exam_title: (s.exams as { title: string })?.title ?? "不明",
    char_count: s.char_count as number,
    status: s.status as string,
    submitted_at: s.submitted_at as string,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">提出履歴</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          過去の提出と採点結果を確認できます
        </p>
      </div>
      {items.length > 0 ? (
        <HistoryTable items={items} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">提出履歴がありません</p>
          <p className="text-sm text-muted-foreground">
            問題に解答すると、ここに履歴が表示されます。
          </p>
        </div>
      )}
    </div>
  );
}
