import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/openai";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceClient();

    // Get yesterday's date range
    const yesterday = subDays(new Date(), 1);
    const startDate = startOfDay(yesterday);
    const endDate = endOfDay(yesterday);
    const summaryDate = format(startDate, "yyyy-MM-dd");

    // Get all users who have entries for yesterday but no summary yet
    const { data: usersWithEntries, error: usersError } = await serviceSupabase
      .from("entries")
      .select("user_id")
      .gte("occurred_at", startDate.toISOString())
      .lt("occurred_at", endDate.toISOString());

    if (usersError) {
      console.error("Users fetch error:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!usersWithEntries || usersWithEntries.length === 0) {
      return NextResponse.json({ message: "No users with entries for yesterday" });
    }

    // Get unique user IDs
    const userIds = [...new Set(usersWithEntries.map((u) => u.user_id))];

    let summariesGenerated = 0;

    for (const userId of userIds) {
      // Check if summary already exists
      const { data: existingSummary } = await serviceSupabase
        .from("daily_summaries")
        .select("id")
        .eq("user_id", userId)
        .eq("summary_date", summaryDate)
        .single();

      if (existingSummary) {
        continue; // Summary already exists
      }

      // Get entries for the user
      const { data: entries } = await serviceSupabase.rpc("get_entries_for_period", {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (!entries || entries.length === 0) {
        continue;
      }

      // Get user's data key
      const dataKey = await getOrCreateUserDataKey(userId, serviceSupabase);

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

      if (decryptedEntries.length === 0) {
        continue;
      }

      // Generate summary
      const summaryResult = await generateSummary(decryptedEntries, "daily");

      // Save summary
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

    return NextResponse.json({
      message: `Generated ${summariesGenerated} daily summaries`,
    });
  } catch (error) {
    console.error("Daily cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
