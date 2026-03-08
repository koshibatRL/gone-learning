"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ExamItem {
  id: string;
  title: string;
  standard_char_count: number;
  created_at: string;
  evaluation_sections: { count: number }[];
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/exams")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">問題管理</h1>
        <Link href="/admin/exams/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </div>
      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">問題がありません。</p>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
              <Card className="border transition-shadow hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold tracking-tight">
                      {exam.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="rounded-sm text-xs">
                        {exam.standard_char_count}字
                      </Badge>
                      <Badge variant="outline" className="rounded-sm text-xs">
                        {exam.evaluation_sections?.[0]?.count ?? 0}セクション
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    ID: {exam.id}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
