import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/types/database";

interface ExamCardProps {
  exam: Exam;
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <Link href={`/exams/${exam.id}`}>
      <Card className="border transition-shadow hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-bold tracking-tight">
              {exam.title}
            </CardTitle>
            <Badge variant="secondary" className="rounded-sm text-xs">
              {exam.standard_char_count}字
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="line-clamp-2 leading-relaxed">{exam.prompt_text}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
