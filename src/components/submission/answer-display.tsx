"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnswerDisplayProps {
  answerText: string;
  charCount: number;
}

export function AnswerDisplay({ answerText, charCount }: AnswerDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          答案テキスト
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({charCount}字)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm md:text-base leading-7">
          {answerText}
        </p>
      </CardContent>
    </Card>
  );
}
