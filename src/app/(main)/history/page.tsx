import { createClient } from "@/lib/supabase/server";
import { HistoryTable } from "@/components/history/history-table";

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
      <h1 className="mb-4 text-xl font-bold tracking-tight">提出履歴</h1>
      <HistoryTable items={items} />
    </div>
  );
}
