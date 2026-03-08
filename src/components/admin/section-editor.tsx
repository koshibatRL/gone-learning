"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChoiceRow } from "./choice-row";
import type { EvaluationChoice } from "@/types/database";

interface SectionEditorProps {
  section: {
    id: string;
    section_number: number;
    title: string;
    evaluation_choices: EvaluationChoice[];
  };
  displayNumber: number;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function SectionEditor({
  section,
  displayNumber,
  onDeleted,
  onUpdated,
}: SectionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);

  const sortedChoices = [...section.evaluation_choices].sort(
    (a, b) => a.choice_number - b.choice_number
  );

  async function handleSaveSection() {
    setSaving(true);
    await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_number: displayNumber, title }),
    });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteSection() {
    if (
      !confirm(
        `評価${displayNumber}「${title}」を全選択肢ごと削除しますか？`
      )
    )
      return;
    await fetch(`/api/admin/sections/${section.id}`, { method: "DELETE" });
    onDeleted();
  }

  async function handleAddChoice() {
    setAdding(true);
    const nextNumber =
      sortedChoices.length > 0
        ? sortedChoices[sortedChoices.length - 1].choice_number + 1
        : displayNumber * 10;

    await fetch("/api/admin/choices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: section.id,
        choice_number: nextNumber,
        summary: "",
        feedback_text: "",
      }),
    });
    setAdding(false);
    onUpdated();
  }

  return (
    <Card className="border">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="w-6 text-center text-sm font-medium text-muted-foreground">
            {displayNumber}
          </span>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            className="flex-1 font-medium"
          />
          <span className="shrink-0 text-xs text-muted-foreground">
            {sortedChoices.length}件
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSaveSection}
            disabled={saving || !dirty}
            className={saved ? "text-green-600" : ""}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDeleteSection}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-4">
          <div className="space-y-3">
            {sortedChoices.map((choice, index) => (
              <ChoiceRow
                key={choice.id}
                choice={choice}
                displayNumber={index + 1}
                onDeleted={onUpdated}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleAddChoice}
            disabled={adding}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            選択肢を追加
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
