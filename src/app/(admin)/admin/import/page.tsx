import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">
        データインポート
      </h1>
      <Card className="border">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            このページはまだ実装されていません
          </p>
          <p className="text-sm text-muted-foreground">
            問題や講評のデータ保存方法に合わせて、今後実装予定です。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
