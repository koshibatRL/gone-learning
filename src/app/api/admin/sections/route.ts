import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const { exam_id, section_number, title } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("evaluation_sections")
    .insert({ exam_id, section_number, title })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
