import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ choiceId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { choiceId } = await params;
  const body = await request.json();
  const { choice_number, summary, feedback_text } = body;

  const admin = createAdminClient();
  const { error } = await admin
    .from("evaluation_choices")
    .update({ choice_number, summary, feedback_text })
    .eq("id", choiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ choiceId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { choiceId } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("evaluation_choices")
    .delete()
    .eq("id", choiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
