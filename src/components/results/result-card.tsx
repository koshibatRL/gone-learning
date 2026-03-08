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
  sectionTitle,
  choiceSummary,
  feedbackText,
  isPositive,
}: ResultCardProps) {
  return (
    <Card className={isPositive ? "border-success/20" : "border-warning/20"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {isPositive ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
              <CircleCheck className="h-3.5 w-3.5 text-success" />
            </div>
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            </div>
          )}
          <span className="text-muted-foreground">{sectionTitle}</span>
        </CardTitle>
        <p className="text-sm font-medium pl-7">{choiceSummary}</p>
      </CardHeader>
      <CardContent className="pl-[calc(1rem+28px)]">
        <div className="rounded-md bg-muted/50 px-3 py-2.5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {feedbackText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
