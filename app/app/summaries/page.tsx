"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/summary-card";
import { useToast } from "@/components/ui/use-toast";
import type { DailySummary, WeeklySummary, MonthlySummary, Granularity } from "@/types";

export default function SummariesPage() {
  const [activeTab, setActiveTab] = useState<Granularity>("daily");
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Load summaries
  const loadSummaries = useCallback(async (granularity: Granularity) => {
    try {
      const res = await fetch(`/api/summaries/list?granularity=${granularity}&limit=20`);
      const data = await res.json();

      if (data.summaries) {
        switch (granularity) {
          case "daily":
            setDailySummaries(data.summaries);
            break;
          case "weekly":
            setWeeklySummaries(data.summaries);
            break;
          case "monthly":
            setMonthlySummaries(data.summaries);
            break;
        }
      }
    } catch (error) {
      console.error("Failed to load summaries:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaries(activeTab);
  }, [activeTab, loadSummaries]);

  // Generate summary for a specific date
  const generateSummary = useCallback(
    async (granularity: Granularity, dayOrStartISO?: string) => {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/summaries/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ granularity, dayOrStartISO }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to generate summary");
        }

        toast({
          title: "Summary generated",
          description: "Your summary has been created successfully.",
        });

        // Reload summaries
        await loadSummaries(granularity);
      } catch (error) {
        console.error("Failed to generate summary:", error);
        toast({
          title: "Failed to generate",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [loadSummaries, toast]
  );

  // Generate yesterday's summary
  const generateYesterdaySummary = () => {
    const yesterday = subDays(new Date(), 1);
    generateSummary("daily", yesterday.toISOString());
  };

  // Generate this week's summary
  const generateThisWeekSummary = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    generateSummary("weekly", weekStart.toISOString());
  };

  // Generate this month's summary
  const generateThisMonthSummary = () => {
    const monthStart = startOfMonth(new Date());
    generateSummary("monthly", monthStart.toISOString());
  };

  const getSummaries = () => {
    switch (activeTab) {
      case "daily":
        return dailySummaries;
      case "weekly":
        return weeklySummaries;
      case "monthly":
        return monthlySummaries;
    }
  };

  const summaries = getSummaries();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Summaries</h1>
          <p className="text-muted-foreground">
            AI-generated insights from your journal
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Granularity)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              switch (activeTab) {
                case "daily":
                  generateYesterdaySummary();
                  break;
                case "weekly":
                  generateThisWeekSummary();
                  break;
                case "monthly":
                  generateThisMonthSummary();
                  break;
              }
            }}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate{" "}
            {activeTab === "daily"
              ? "Yesterday"
              : activeTab === "weekly"
              ? "This Week"
              : "This Month"}
          </Button>
        </div>

        <TabsContent value="daily" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dailySummaries.length === 0 ? (
            <EmptyState
              message="No daily summaries yet"
              action="Generate yesterday's summary"
              onClick={generateYesterdaySummary}
              isGenerating={isGenerating}
            />
          ) : (
            dailySummaries.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                type="daily"
                onRegenerate={(date) => generateSummary("daily", date)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : weeklySummaries.length === 0 ? (
            <EmptyState
              message="No weekly summaries yet"
              action="Generate this week's summary"
              onClick={generateThisWeekSummary}
              isGenerating={isGenerating}
            />
          ) : (
            weeklySummaries.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                type="weekly"
                onRegenerate={(date) => generateSummary("weekly", date)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : monthlySummaries.length === 0 ? (
            <EmptyState
              message="No monthly summaries yet"
              action="Generate this month's summary"
              onClick={generateThisMonthSummary}
              isGenerating={isGenerating}
            />
          ) : (
            monthlySummaries.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                type="monthly"
                onRegenerate={(date) => generateSummary("monthly", date)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  message,
  action,
  onClick,
  isGenerating,
}: {
  message: string;
  action: string;
  onClick: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button onClick={onClick} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {action}
      </Button>
    </div>
  );
}
