"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [charCount, setCharCount] = useState(800);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        prompt_text: promptText,
        standard_char_count: charCount,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "作成に失敗しました");
      setSaving(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/admin/exams/${id}`);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">問題を作成</h1>
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>タイトル</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>出題文</Label>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label>標準字数</Label>
            <Input
              type="number"
              value={charCount}
              onChange={(e) => setCharCount(parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSave} disabled={saving || !title || !promptText}>
            {saving ? "作成中..." : "作成"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
