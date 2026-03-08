import { CircleCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultCardProps {
  sectionNumber: number;
  sectionTitle: string;
  choiceSummary: string;
  feedbackText: string;
  isPositive: boolean;
}

export function ResultCard({
  sectionNumber,
  sectionTitle,
  choiceSummary,
  feedbackText,
  isPositive,
}: ResultCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {isPositive ? (
            <CircleCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          {sectionTitle}
        </CardTitle>
        <p className="text-sm font-medium pl-[22px]">{choiceSummary}</p>
      </CardHeader>
      <CardContent className="pl-[calc(1.5rem+22px)]">
        <div className="rounded-md bg-muted/50 px-3 py-2.5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {feedbackText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
