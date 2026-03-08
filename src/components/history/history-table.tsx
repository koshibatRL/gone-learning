"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface HistoryItem {
  id: string;
  exam_id: string;
  exam_title: string;
  char_count: number;
  status: string;
  submitted_at: string;
}

interface HistoryTableProps {
  items: HistoryItem[];
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待機中", variant: "secondary" },
  evaluating: { label: "採点中", variant: "secondary" },
  evaluated: { label: "採点済", variant: "default" },
  error: { label: "エラー", variant: "destructive" },
};

export function HistoryTable({ items }: HistoryTableProps) {
  return (
    <>
      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => {
          const statusInfo = STATUS_LABELS[item.status] ?? {
            label: item.status,
            variant: "secondary" as const,
          };

          return (
            <Link
              key={item.id}
              href={`/exams/${item.exam_id}/result/${item.id}`}
            >
              <Card className="border transition-all hover:border-primary/20 hover:shadow-sm">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.exam_title}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.char_count}字</span>
                      <span>{formatDate(item.submitted_at)}</span>
                    </div>
                  </div>
                  <Badge
                    variant={statusInfo.variant}
                    className="shrink-0 rounded-sm text-xs"
                  >
                    {statusInfo.label}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>問題名</TableHead>
              <TableHead className="w-20 text-right">文字数</TableHead>
              <TableHead className="w-24 text-center">状態</TableHead>
              <TableHead className="w-40">提出日時</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const statusInfo = STATUS_LABELS[item.status] ?? {
                label: item.status,
                variant: "secondary" as const,
              };

              return (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <Link
                      href={`/exams/${item.exam_id}/result/${item.id}`}
                      className="text-sm font-medium underline underline-offset-4 decoration-transparent transition-colors group-hover:decoration-current"
                    >
                      {item.exam_title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {item.char_count}字
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={statusInfo.variant}
                      className="rounded-sm text-xs"
                    >
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.submitted_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
