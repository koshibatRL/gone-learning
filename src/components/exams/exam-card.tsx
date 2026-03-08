import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/types/database";

interface ExamCardProps {
  exam: Exam;
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <Link href={`/exams/${exam.id}`}>
      <Card className="group border transition-all hover:border-primary/20 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-bold tracking-tight">
              {exam.title}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0 rounded-sm text-xs">
              {exam.standard_char_count}字
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="line-clamp-2 leading-relaxed">{exam.prompt_text}</p>
          </div>
          <div className="mt-3 flex items-center justify-end text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            この問題に挑戦する
            <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
