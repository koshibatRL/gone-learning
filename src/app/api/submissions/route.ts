import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSubmission } from "@/lib/anthropic/grading";
import { after } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await request.json();
  const { exam_id, answer_text } = body;

  if (!exam_id || !answer_text || answer_text.trim().length === 0) {
    return NextResponse.json(
      { error: "問題IDと答案テキストは必須です" },
      { status: 400 }
    );
  }

  // Verify exam exists
  const admin = createAdminClient();
  const { data: exam } = await admin
    .from("exams")
    .select("id")
    .eq("id", exam_id)
    .single();

  if (!exam) {
    return NextResponse.json(
      { error: "指定された問題が見つかりません" },
      { status: 404 }
    );
  }

  // Create submission
  const { data: submission, error: insertError } = await admin
    .from("submissions")
    .insert({
      exam_id,
      user_id: user.id,
      answer_text: answer_text.trim(),
      char_count: answer_text.trim().length,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !submission) {
    console.error("Failed to create submission:", insertError);
    return NextResponse.json(
      { error: "答案の保存に失敗しました" },
      { status: 500 }
    );
  }

  // Fire-and-forget grading using Next.js after()
  after(async () => {
    try {
      await gradeSubmission(submission.id);
    } catch (error) {
      console.error("Background grading failed:", error);
    }
  });

  return NextResponse.json({ submission_id: submission.id });
}
