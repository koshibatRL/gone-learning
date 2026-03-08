"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">提出履歴がありません。</p>
    );
  }

  return (
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
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  href={`/exams/${item.exam_id}/result/${item.id}`}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  {item.exam_title}
                </Link>
              </TableCell>
              <TableCell className="text-right text-sm">
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
  );
}
