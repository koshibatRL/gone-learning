"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnswerDisplayProps {
  answerText: string;
  charCount: number;
}

export function AnswerDisplay({ answerText, charCount }: AnswerDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">答案テキスト</CardTitle>
          <Badge variant="secondary" className="rounded-sm text-xs tabular-nums">
            {charCount}字
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-7 md:text-base">
          {answerText}
        </p>
      </CardContent>
    </Card>
  );
}
