import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { decrypt, getOrCreateUserDataKey } from "@/lib/crypto";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import JSZip from "jszip";

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
    const { month } = body as { month: string }; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // Calculate date range
    const referenceDate = parseISO(`${month}-01`);
    const startDate = startOfMonth(referenceDate);
    const endDate = endOfMonth(referenceDate);

    // Get entries for the month
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

    // Get summaries for the month
    const { data: dailySummaries } = await serviceSupabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user.id)
      .gte("summary_date", format(startDate, "yyyy-MM-dd"))
      .lte("summary_date", format(endDate, "yyyy-MM-dd"))
      .order("summary_date", { ascending: true });

    const { data: monthlySummary } = await serviceSupabase
      .from("monthly_summaries")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_start", format(startDate, "yyyy-MM-dd"))
      .single();

    // Decrypt entries
    const dataKey = await getOrCreateUserDataKey(user.id, serviceSupabase);
    const decryptedEntries: Array<{
      id: string;
      text: string;
      occurred_at: string;
      sentiment: string | null;
      mood: string | null;
      energy: number | null;
    }> = [];

    if (entries) {
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
            id: entry.entry_id,
            text,
            occurred_at: entry.occurred_at,
            sentiment: null,
            mood: null,
            energy: null,
          });
        } catch (decryptError) {
          console.error("Decrypt error:", decryptError);
        }
      }
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add README
    const readme = `# Tellit Journal Export - ${format(referenceDate, "MMMM yyyy")}

Exported on: ${new Date().toISOString()}

This archive contains:
- entries/ - Individual journal entries in Markdown format
- entries.json - All entries in JSON format
- summaries/ - Daily summaries (if generated)
- monthly-summary.md - Monthly summary (if generated)

## Privacy Note
These files contain your private journal entries. Handle with care.
`;
    zip.file("README.md", readme);

    // Add entries as Markdown
    const entriesFolder = zip.folder("entries");
    for (const entry of decryptedEntries) {
      const date = new Date(entry.occurred_at);
      const filename = `${format(date, "yyyy-MM-dd-HHmmss")}.md`;
      const content = `# Journal Entry - ${format(date, "MMMM d, yyyy 'at' h:mm a")}

${entry.text}

---
*Recorded: ${entry.occurred_at}*
`;
      entriesFolder?.file(filename, content);
    }

    // Add entries as JSON
    const entriesJson = JSON.stringify(decryptedEntries, null, 2);
    zip.file("entries.json", entriesJson);

    // Add daily summaries
    if (dailySummaries && dailySummaries.length > 0) {
      const summariesFolder = zip.folder("summaries");
      for (const summary of dailySummaries) {
        const filename = `${summary.summary_date}.md`;
        const content = `# Daily Summary - ${summary.summary_date}

## Summary
${summary.summary}

## Key Points
${(summary.key_points as string[]).map((p: string) => `- ${p}`).join("\n")}

## Decisions
${(summary.decisions as string[]).map((d: string) => `- ${d}`).join("\n") || "None recorded"}

## Next Actions
${(summary.next_actions as string[]).map((a: string) => `- ${a}`).join("\n") || "None recorded"}
`;
        summariesFolder?.file(filename, content);
      }
    }

    // Add monthly summary
    if (monthlySummary) {
      const content = `# Monthly Summary - ${format(referenceDate, "MMMM yyyy")}

## Overview
${monthlySummary.summary}

## Key Points
${(monthlySummary.key_points as string[]).map((p: string) => `- ${p}`).join("\n")}

## Decisions Made
${(monthlySummary.decisions as string[]).map((d: string) => `- ${d}`).join("\n") || "None recorded"}

## Next Actions
${(monthlySummary.next_actions as string[]).map((a: string) => `- ${a}`).join("\n") || "None recorded"}
`;
      zip.file("monthly-summary.md", content);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // Return as downloadable file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="recall-export-${month}.zip"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
