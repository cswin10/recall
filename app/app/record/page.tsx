"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Check } from "lucide-react";
import { AudioRecorder } from "@/components/audio-recorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function RecordPage() {
  const [occurredAt, setOccurredAt] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      try {
        const formData = new FormData();
        formData.append("file", blob);

        const url = new URL("/api/entries/ingest", window.location.origin);
        if (occurredAt) {
          url.searchParams.set("occurred_at", new Date(occurredAt).toISOString());
        }

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save entry");
        }

        // Generate embedding in background
        fetch("/api/entries/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: data.entry_id }),
        }).catch(console.error);

        setIsSuccess(true);
        toast({
          title: "Entry saved!",
          description: "Your journal entry has been recorded and processed.",
        });

        // Reset after a moment
        setTimeout(() => {
          setIsSuccess(false);
          setOccurredAt("");
        }, 3000);
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Failed to save",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
        throw error; // Re-throw so recorder shows error state
      }
    },
    [occurredAt, toast]
  );

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Record Entry</h1>
        <p className="text-muted-foreground">
          Speak your thoughts and they&apos;ll be transcribed automatically
        </p>
      </div>

      {/* Success state */}
      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 py-12 animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Entry Saved!</h2>
          <p className="text-muted-foreground text-center">
            Your entry has been transcribed, analyzed, and stored securely.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsSuccess(false)}>
              Record another
            </Button>
            <Button onClick={() => router.push("/app")}>View timeline</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Recorder */}
          <div className="py-8">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          </div>

          {/* Optional date/time picker */}
          <div className="mt-8 border-t pt-6">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              {occurredAt
                ? `Recording for: ${format(new Date(occurredAt), "MMM d, yyyy 'at' h:mm a")}`
                : "Backdate this entry (optional)"}
            </button>

            {showDatePicker && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg animate-fade-in">
                <Label htmlFor="occurredAt" className="text-sm">
                  When did this happen?
                </Label>
                <Input
                  id="occurredAt"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  className="mt-2"
                />
                {occurredAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setOccurredAt("");
                      setShowDatePicker(false);
                    }}
                  >
                    Clear date
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Tips for better entries</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Speak naturally, as if talking to a friend</li>
              <li>• Include how you feel, not just what happened</li>
              <li>• Maximum recording length is 10 minutes</li>
              <li>• Your entry is encrypted before being stored</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
