import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { sectionId } = await params;
  const body = await request.json();
  const { section_number, title } = body;

  const admin = createAdminClient();
  const { error } = await admin
    .from("evaluation_sections")
    .update({ section_number, title })
    .eq("id", sectionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { sectionId } = await params;
  const admin = createAdminClient();

  await admin.from("evaluation_choices").delete().eq("section_id", sectionId);
  const { error } = await admin
    .from("evaluation_sections")
    .delete()
    .eq("id", sectionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
