import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("exams")
    .select("*, evaluation_sections(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const { title, prompt_text, standard_char_count } = body;

  if (!title || !prompt_text || !standard_char_count) {
    return NextResponse.json({ error: "全項目必須です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("exams")
    .insert({ title, prompt_text, standard_char_count, created_by: user.id })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
