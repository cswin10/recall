import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Granularity, DailySummary, WeeklySummary, MonthlySummary } from "@/types";

type SummaryType = DailySummary | WeeklySummary | MonthlySummary;

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const granularity = request.nextUrl.searchParams.get("granularity") as Granularity;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);

    if (!["daily", "weekly", "monthly"].includes(granularity)) {
      return NextResponse.json({ error: "Invalid granularity" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    const tableMap: Record<Granularity, string> = {
      daily: "daily_summaries",
      weekly: "weekly_summaries",
      monthly: "monthly_summaries",
    };

    const orderColumnMap: Record<Granularity, string> = {
      daily: "summary_date",
      weekly: "week_start",
      monthly: "month_start",
    };

    const table = tableMap[granularity];
    const orderColumn = orderColumnMap[granularity];

    const { data: summaries, error } = await serviceSupabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .order(orderColumn, { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      console.error("Summaries fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 });
    }

    return NextResponse.json({ summaries: summaries as SummaryType[] });
  } catch (error) {
    console.error("List summaries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
