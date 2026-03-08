"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionEditor } from "@/components/admin/section-editor";
import type { EvaluationChoice } from "@/types/database";

interface ExamSection {
  id: string;
  section_number: number;
  title: string;
  evaluation_choices: EvaluationChoice[];
}

interface ExamDetail {
  id: string;
  title: string;
  prompt_text: string;
  standard_char_count: number;
  sections: ExamSection[];
}

export default function AdminExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Exam metadata state
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [charCount, setCharCount] = useState("800");
  const [metaDirty, setMetaDirty] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [addingSection, setAddingSection] = useState(false);

  const fetchExam = useCallback(async () => {
    const res = await fetch(`/api/admin/exams/${examId}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data: ExamDetail = await res.json();
    setExam(data);
    setTitle(data.title);
    setPromptText(data.prompt_text);
    setCharCount(String(data.standard_char_count));
    setLoading(false);
    setMetaDirty(false);
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  async function handleSaveMeta() {
    setMetaSaving(true);
    await fetch(`/api/admin/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        prompt_text: promptText,
        standard_char_count: parseInt(charCount) || 0,
      }),
    });
    setMetaSaving(false);
    setMetaDirty(false);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
  }

  async function handleDeleteExam() {
    if (!confirm(`問題「${title}」を全データごと削除しますか？この操作は取り消せません。`))
      return;
    await fetch(`/api/admin/exams/${examId}`, { method: "DELETE" });
    router.push("/admin/exams");
  }

  async function handleAddSection() {
    setAddingSection(true);
    const nextNumber =
      exam && exam.sections.length > 0
        ? Math.max(...exam.sections.map((s) => s.section_number)) + 1
        : 1;

    await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: examId,
        section_number: nextNumber,
        title: "新しいセクション",
      }),
    });
    setAddingSection(false);
    fetchExam();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!exam) {
    return <p className="text-sm text-muted-foreground">問題が見つかりません。</p>;
  }

  const sortedSections = [...exam.sections].sort(
    (a, b) => a.section_number - b.section_number
  );

  return (
    <div className="space-y-6">
      {/* Exam metadata */}
      <Card className="border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              問題情報
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteExam}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              削除
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>タイトル</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setMetaDirty(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>出題文</Label>
            <Textarea
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                setMetaDirty(true);
              }}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>標準字数</Label>
            <Input
              type="number"
              value={charCount}
              onChange={(e) => {
                setCharCount(e.target.value);
                setMetaDirty(true);
              }}
              className="w-32"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveMeta}
              disabled={metaSaving || !metaDirty}
              size="sm"
              className={metaSaved ? "bg-green-600 hover:bg-green-600" : ""}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {metaSaving ? "保存中..." : metaSaved ? "保存しました" : "保存"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sections */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">
            評価セクション ({sortedSections.length})
          </h2>
        </div>
        <div className="space-y-3">
          {sortedSections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              displayNumber={index + 1}
              onDeleted={fetchExam}
              onUpdated={fetchExam}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={handleAddSection}
          disabled={addingSection}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          セクションを追加
        </Button>
      </div>
    </div>
  );
}
