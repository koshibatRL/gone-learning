"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function GradingProgress() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-bold tracking-tight">採点中</h2>
          <p className="text-sm text-muted-foreground">
            AIが答案を評価しています。しばらくお待ちください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
