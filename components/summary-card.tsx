"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DailySummary, WeeklySummary, MonthlySummary } from "@/types";

type Summary = DailySummary | WeeklySummary | MonthlySummary;

interface SummaryCardProps {
  summary: Summary;
  type: "daily" | "weekly" | "monthly";
  onRegenerate?: (date: string) => Promise<void>;
}

function getDateFromSummary(summary: Summary, type: "daily" | "weekly" | "monthly"): string {
  if (type === "daily") {
    return (summary as DailySummary).summary_date;
  } else if (type === "weekly") {
    return (summary as WeeklySummary).week_start;
  } else {
    return (summary as MonthlySummary).month_start;
  }
}

function formatDateRange(date: string, type: "daily" | "weekly" | "monthly"): string {
  const d = parseISO(date);
  if (type === "daily") {
    return format(d, "EEEE, MMMM d, yyyy");
  } else if (type === "weekly") {
    const endDate = new Date(d);
    endDate.setDate(endDate.getDate() + 6);
    return `${format(d, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  } else {
    return format(d, "MMMM yyyy");
  }
}

export function SummaryCard({ summary, type, onRegenerate }: SummaryCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const date = getDateFromSummary(summary, type);
  const keyPoints = summary.key_points as string[];
  const decisions = summary.decisions as string[];
  const nextActions = summary.next_actions as string[];

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(date);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{formatDateRange(date, type)}</h3>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {summary.summary}
        </p>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Key Points */}
            {keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex">
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decisions */}
            {decisions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Decisions</h4>
                <ul className="space-y-1">
                  {decisions.map((decision, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex">
                      <span className="mr-2">✓</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Actions */}
            {nextActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Next Actions</h4>
                <ul className="space-y-1">
                  {nextActions.map((action, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex">
                      <span className="mr-2">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
