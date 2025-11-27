import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/openai";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
} from "date-fns";
import type { Granularity, SummaryResult } from "@/types";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { granularity, dayOrStartISO } = body as {
      granularity: Granularity;
      dayOrStartISO?: string;
    };

    if (!["daily", "weekly", "monthly"].includes(granularity)) {
      return NextResponse.json({ error: "Invalid granularity" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // Calculate date range
    const referenceDate = dayOrStartISO ? parseISO(dayOrStartISO) : new Date();
    let startDate: Date;
    let endDate: Date;
    let summaryKey: string;

    switch (granularity) {
      case "daily":
        startDate = startOfDay(referenceDate);
        endDate = endOfDay(referenceDate);
        summaryKey = format(startDate, "yyyy-MM-dd");
        break;
      case "weekly":
        startDate = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(referenceDate, { weekStartsOn: 1 });
        summaryKey = format(startDate, "yyyy-MM-dd");
        break;
      case "monthly":
        startDate = startOfMonth(referenceDate);
        endDate = endOfMonth(referenceDate);
        summaryKey = format(startDate, "yyyy-MM-dd");
        break;
    }

    // Get entries for the period
    const { data: entries, error: entriesError } = await serviceSupabase.rpc(
      "get_entries_for_period",
      {
        p_user_id: user.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      }
    );

    if (entriesError) {
      console.error("Entries fetch error:", entriesError);
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    // If no entries, return early
    if (!entries || entries.length === 0) {
      return NextResponse.json({
        summary: "No entries for this period.",
        key_points: [],
        decisions: [],
        next_actions: [],
      } as SummaryResult);
    }

    // Get user's data key for decryption
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);

    // Decrypt entries
    const decryptedEntries: { text: string; occurred_at: string }[] = [];
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

    // Generate summary using OpenAI
    const summaryResult = await generateSummary(decryptedEntries, granularity);

    // Upsert summary to database
    const tableMap: Record<Granularity, string> = {
      daily: "daily_summaries",
      weekly: "weekly_summaries",
      monthly: "monthly_summaries",
    };

    const columnMap: Record<Granularity, string> = {
      daily: "summary_date",
      weekly: "week_start",
      monthly: "month_start",
    };

    const table = tableMap[granularity];
    const column = columnMap[granularity];

    const { error: upsertError } = await serviceSupabase.from(table).upsert(
      {
        user_id: user.id,
        [column]: summaryKey,
        summary: summaryResult.summary,
        key_points: summaryResult.key_points,
        decisions: summaryResult.decisions,
        next_actions: summaryResult.next_actions,
      },
      { onConflict: `user_id,${column}` }
    );

    if (upsertError) {
      console.error("Summary upsert error:", upsertError);
      // Still return the result even if save failed
    }

    return NextResponse.json(summaryResult);
  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
