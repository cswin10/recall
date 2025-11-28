import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/openai";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import {
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  getDay,
  getDate,
} from "date-fns";

// Single cron job that handles daily, weekly, and monthly summaries
// Runs daily at 5 AM UTC - checks what summaries need to be generated

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceClient();
    const now = new Date();
    const results: string[] = [];

    // Always generate daily summaries (for yesterday)
    const dailyResult = await generateDailySummaries(serviceSupabase);
    results.push(dailyResult);

    // Generate weekly summaries on Mondays (for last week)
    if (getDay(now) === 1) {
      const weeklyResult = await generateWeeklySummaries(serviceSupabase);
      results.push(weeklyResult);
    }

    // Generate monthly summaries on the 1st (for last month)
    if (getDate(now) === 1) {
      const monthlyResult = await generateMonthlySummaries(serviceSupabase);
      results.push(monthlyResult);
    }

    return NextResponse.json({
      message: results.join("; "),
    });
  } catch (error) {
    console.error("Summaries cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function generateDailySummaries(serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>): Promise<string> {
  const yesterday = subDays(new Date(), 1);
  const startDate = startOfDay(yesterday);
  const endDate = endOfDay(yesterday);
  const summaryDate = format(startDate, "yyyy-MM-dd");

  const { data: usersWithEntries, error: usersError } = await serviceSupabase
    .from("entries")
    .select("user_id")
    .gte("occurred_at", startDate.toISOString())
    .lt("occurred_at", endDate.toISOString());

  if (usersError || !usersWithEntries || usersWithEntries.length === 0) {
    return "Daily: 0 summaries";
  }

  const userIds: string[] = Array.from(new Set(usersWithEntries.map((u: { user_id: string }) => u.user_id)));
  let summariesGenerated = 0;

  for (const userId of userIds) {
    const { data: existingSummary } = await serviceSupabase
      .from("daily_summaries")
      .select("id")
      .eq("user_id", userId)
      .eq("summary_date", summaryDate)
      .single();

    if (existingSummary) continue;

    const { data: entries } = await serviceSupabase.rpc("get_entries_for_period", {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (!entries || entries.length === 0) continue;

    const dataKey = await getOrCreateUserDataKey(userId, serviceSupabase);
    const decryptedEntries = decryptEntries(entries, dataKey);

    if (decryptedEntries.length === 0) continue;

    const summaryResult = await generateSummary(decryptedEntries, "daily");

    await serviceSupabase.from("daily_summaries").insert({
      user_id: userId,
      summary_date: summaryDate,
      summary: summaryResult.summary,
      key_points: summaryResult.key_points,
      decisions: summaryResult.decisions,
      next_actions: summaryResult.next_actions,
    });

    summariesGenerated++;
  }

  return `Daily: ${summariesGenerated} summaries`;
}

async function generateWeeklySummaries(serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>): Promise<string> {
  const lastWeek = subWeeks(new Date(), 1);
  const startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
  const weekStart = format(startDate, "yyyy-MM-dd");

  const { data: usersWithEntries, error: usersError } = await serviceSupabase
    .from("entries")
    .select("user_id")
    .gte("occurred_at", startDate.toISOString())
    .lt("occurred_at", endDate.toISOString());

  if (usersError || !usersWithEntries || usersWithEntries.length === 0) {
    return "Weekly: 0 summaries";
  }

  const userIds: string[] = Array.from(new Set(usersWithEntries.map((u: { user_id: string }) => u.user_id)));
  let summariesGenerated = 0;

  for (const userId of userIds) {
    const { data: existingSummary } = await serviceSupabase
      .from("weekly_summaries")
      .select("id")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .single();

    if (existingSummary) continue;

    const { data: entries } = await serviceSupabase.rpc("get_entries_for_period", {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (!entries || entries.length === 0) continue;

    const dataKey = await getOrCreateUserDataKey(userId, serviceSupabase);
    const decryptedEntries = decryptEntries(entries, dataKey);

    if (decryptedEntries.length === 0) continue;

    const summaryResult = await generateSummary(decryptedEntries, "weekly");

    await serviceSupabase.from("weekly_summaries").insert({
      user_id: userId,
      week_start: weekStart,
      summary: summaryResult.summary,
      key_points: summaryResult.key_points,
      decisions: summaryResult.decisions,
      next_actions: summaryResult.next_actions,
    });

    summariesGenerated++;
  }

  return `Weekly: ${summariesGenerated} summaries`;
}

async function generateMonthlySummaries(serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>): Promise<string> {
  const lastMonth = subMonths(new Date(), 1);
  const startDate = startOfMonth(lastMonth);
  const endDate = endOfMonth(lastMonth);
  const monthStart = format(startDate, "yyyy-MM-dd");

  const { data: usersWithEntries, error: usersError } = await serviceSupabase
    .from("entries")
    .select("user_id")
    .gte("occurred_at", startDate.toISOString())
    .lt("occurred_at", endDate.toISOString());

  if (usersError || !usersWithEntries || usersWithEntries.length === 0) {
    return "Monthly: 0 summaries";
  }

  const userIds: string[] = Array.from(new Set(usersWithEntries.map((u: { user_id: string }) => u.user_id)));
  let summariesGenerated = 0;

  for (const userId of userIds) {
    const { data: existingSummary } = await serviceSupabase
      .from("monthly_summaries")
      .select("id")
      .eq("user_id", userId)
      .eq("month_start", monthStart)
      .single();

    if (existingSummary) continue;

    const { data: entries } = await serviceSupabase.rpc("get_entries_for_period", {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (!entries || entries.length === 0) continue;

    const dataKey = await getOrCreateUserDataKey(userId, serviceSupabase);
    const decryptedEntries = decryptEntries(entries, dataKey);

    if (decryptedEntries.length === 0) continue;

    const summaryResult = await generateSummary(decryptedEntries, "monthly");

    await serviceSupabase.from("monthly_summaries").insert({
      user_id: userId,
      month_start: monthStart,
      summary: summaryResult.summary,
      key_points: summaryResult.key_points,
      decisions: summaryResult.decisions,
      next_actions: summaryResult.next_actions,
    });

    summariesGenerated++;
  }

  return `Monthly: ${summariesGenerated} summaries`;
}

function decryptEntries(
  entries: Array<{
    text_encrypted: string;
    text_iv: string;
    text_auth_tag: string;
    occurred_at: string;
  }>,
  dataKey: Buffer
): Array<{ text: string; occurred_at: string }> {
  const decryptedEntries: Array<{ text: string; occurred_at: string }> = [];

  for (const entry of entries) {
    try {
      const text = decrypt(
        {
          ciphertext: entry.text_encrypted,
          iv: entry.text_iv,
          authTag: entry.text_auth_tag,
        },
        dataKey
      );
      decryptedEntries.push({
        text,
        occurred_at: entry.occurred_at,
      });
    } catch (decryptError) {
      console.error("Decrypt error:", decryptError);
    }
  }

  return decryptedEntries;
}
