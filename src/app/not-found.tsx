import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          ページが見つかりません
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link href="/exams">
          <Button variant="outline" size="sm" className="mt-4">
            問題一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
