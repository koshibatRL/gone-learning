import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          ページが見つかりません
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link href="/exams">
          <Button variant="outline" size="sm" className="mt-6">
            問題一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
