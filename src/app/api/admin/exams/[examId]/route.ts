import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { examId } = await params;
  const admin = createAdminClient();

  const { data: exam, error } = await admin
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: sections } = await admin
    .from("evaluation_sections")
    .select("*, evaluation_choices(*)")
    .eq("exam_id", examId)
    .order("section_number");

  return NextResponse.json({ ...exam, sections: sections ?? [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { examId } = await params;
  const body = await request.json();
  const { title, prompt_text, standard_char_count } = body;

  const admin = createAdminClient();
  const { error } = await admin
    .from("exams")
    .update({ title, prompt_text, standard_char_count })
    .eq("id", examId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { examId } = await params;
  const admin = createAdminClient();

  // Delete choices, sections, then exam (cascade should handle this but being explicit)
  const { data: sections } = await admin
    .from("evaluation_sections")
    .select("id")
    .eq("exam_id", examId);

  if (sections && sections.length > 0) {
    const sectionIds = sections.map((s: { id: string }) => s.id);
    await admin.from("evaluation_choices").delete().in("section_id", sectionIds);
    await admin.from("evaluation_sections").delete().eq("exam_id", examId);
  }

  const { error } = await admin.from("exams").delete().eq("id", examId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
