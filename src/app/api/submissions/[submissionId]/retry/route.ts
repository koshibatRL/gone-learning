import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSubmission } from "@/lib/anthropic/grading";

export async function POST(
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

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("submissions")
    .select("id, status, user_id")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return NextResponse.json(
      { error: "提出が見つかりません" },
      { status: 404 }
    );
  }

  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  if (submission.status !== "error") {
    return NextResponse.json(
      { error: "エラー状態の提出のみ再採点できます" },
      { status: 400 }
    );
  }

  // Reset status to pending
  await admin
    .from("submissions")
    .update({ status: "pending", error_message: null })
    .eq("id", submissionId);

  // Fire-and-forget grading
  after(async () => {
    try {
      await gradeSubmission(submissionId);
    } catch (error) {
      console.error("Retry grading failed:", error);
    }
  });

  return NextResponse.json({ success: true });
}
