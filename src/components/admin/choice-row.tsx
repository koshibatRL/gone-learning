"use client";

import { useState } from "react";
import { Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChoiceRowProps {
  choice: {
    id: string;
    choice_number: number;
    summary: string;
    feedback_text: string;
  };
  displayNumber: number;
  onDeleted: () => void;
}

export function ChoiceRow({ choice, displayNumber, onDeleted }: ChoiceRowProps) {
  const [summary, setSummary] = useState(choice.summary);
  const [feedbackText, setFeedbackText] = useState(choice.feedback_text);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  function markDirty() {
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/choices/${choice.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        choice_number: choice.choice_number,
        summary,
        feedback_text: feedbackText,
      }),
    });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`選択肢 ${displayNumber} を削除しますか？`)) return;
    await fetch(`/api/admin/choices/${choice.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <div className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="w-8 text-center text-sm font-medium text-muted-foreground">
          {choice.choice_number}
        </span>
        <Input
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            markDirty();
          }}
          placeholder="概要"
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSave}
          disabled={saving || !dirty}
          className={saved ? "text-green-600" : ""}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <Textarea
        value={feedbackText}
        onChange={(e) => {
          setFeedbackText(e.target.value);
          markDirty();
        }}
        placeholder="講評文"
        className="min-h-[60px] text-sm"
      />
    </div>
  );
}
