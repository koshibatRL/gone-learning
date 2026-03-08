import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, evaluated_at, error_message")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json(
      { error: "提出が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: submission.status,
    evaluated_at: submission.evaluated_at,
    error_message: submission.error_message ?? null,
  });
}
