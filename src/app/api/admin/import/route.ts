import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEvaluationMarkdown } from "@/lib/markdown-parser";

export async function POST(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const { markdown, exam_id } = body;

  if (!markdown || !exam_id) {
    return NextResponse.json(
      { error: "マークダウンと問題IDは必須です" },
      { status: 400 }
    );
  }

  const parsed = parseEvaluationMarkdown(markdown);

  if (parsed.sections.length === 0) {
    return NextResponse.json(
      { error: "セクションが見つかりませんでした" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Delete existing sections and choices for this exam
  const { data: existingSections } = await admin
    .from("evaluation_sections")
    .select("id")
    .eq("exam_id", exam_id);

  if (existingSections && existingSections.length > 0) {
    const sectionIds = existingSections.map((s: { id: string }) => s.id);
    await admin.from("evaluation_choices").delete().in("section_id", sectionIds);
    await admin.from("evaluation_sections").delete().eq("exam_id", exam_id);
  }

  // Insert new sections and choices
  let totalChoices = 0;
  for (const section of parsed.sections) {
    const { data: newSection, error: secError } = await admin
      .from("evaluation_sections")
      .insert({
        exam_id,
        section_number: section.section_number,
        title: section.title,
      })
      .select("id")
      .single();

    if (secError || !newSection) {
      return NextResponse.json(
        { error: `セクション${section.section_number}の作成に失敗: ${secError?.message}` },
        { status: 500 }
      );
    }

    if (section.choices.length > 0) {
      const choiceRows = section.choices.map((c) => ({
        section_id: newSection.id,
        choice_number: c.choice_number,
        summary: c.summary,
        feedback_text: c.feedback_text,
      }));

      const { error: choiceError } = await admin
        .from("evaluation_choices")
        .insert(choiceRows);

      if (choiceError) {
        return NextResponse.json(
          { error: `選択肢の作成に失敗: ${choiceError.message}` },
          { status: 500 }
        );
      }
      totalChoices += choiceRows.length;
    }
  }

  return NextResponse.json({
    sections: parsed.sections.length,
    choices: totalChoices,
  });
}
