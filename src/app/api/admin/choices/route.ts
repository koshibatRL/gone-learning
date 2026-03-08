import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const { section_id, choice_number, summary, feedback_text } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("evaluation_choices")
    .insert({ section_id, choice_number, summary, feedback_text })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
