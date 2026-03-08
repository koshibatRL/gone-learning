import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "全ての項目を入力してください" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  if (data.user) {
    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("users").upsert(
      {
        id: data.user.id,
        email,
        name,
        role: "examinee",
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Failed to upsert user:", upsertError);
      return NextResponse.json(
        { error: "ユーザー情報の保存に失敗しました" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
