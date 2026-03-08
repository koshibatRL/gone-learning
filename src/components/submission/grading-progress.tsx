"use client";

import { Loader2 } from "lucide-react";

export function GradingProgress() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-bold tracking-tight">採点中</h2>
        <p className="text-sm text-muted-foreground">
          AIが答案を評価しています。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
