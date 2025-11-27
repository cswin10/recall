"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => Promise<void>;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm, fall back to other formats
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Unable to access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);

        // Only process if we have some audio
        if (chunksRef.current.length > 0 && duration >= 1) {
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType,
          });

          if (blob.size > 0) {
            setIsProcessing(true);
            try {
              await onRecordingComplete(blob);
            } catch (err) {
              console.error("Failed to process recording:", err);
              setError("Failed to save recording. Please try again.");
            } finally {
              setIsProcessing(false);
            }
          }
        }

        setDuration(0);
        resolve();
      };

      mediaRecorder.stop();
    });
  }, [duration, onRecordingComplete]);

  // Handle press and hold
  const handlePressStart = useCallback(() => {
    if (disabled || isProcessing) return;
    setIsPressing(true);
    startRecording();
  }, [disabled, isProcessing, startRecording]);

  const handlePressEnd = useCallback(() => {
    if (!isPressing) return;
    setIsPressing(false);
    stopRecording();
  }, [isPressing, stopRecording]);

  // Toggle mode for tap
  const handleTap = useCallback(() => {
    if (disabled || isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, isProcessing, isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Max duration check (10 minutes)
  useEffect(() => {
    if (duration >= 600) {
      stopRecording();
    }
  }, [duration, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Recording button */}
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={(e) => {
          // Only trigger tap if not a press-and-hold
          if (!isPressing) {
            e.preventDefault();
            handleTap();
          }
        }}
        disabled={disabled || isProcessing}
        className={cn(
          "relative flex h-32 w-32 items-center justify-center rounded-full transition-all",
          "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-4",
          isRecording
            ? "bg-red-500 recording-pulse shadow-lg shadow-red-500/30"
            : "bg-primary hover:bg-primary/90",
          (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-12 w-12 text-primary-foreground animate-spin" />
        ) : isRecording ? (
          <Square className="h-10 w-10 text-white" fill="white" />
        ) : (
          <Mic className="h-12 w-12 text-primary-foreground" />
        )}

        {/* Pulse ring when recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
        )}
      </button>

      {/* Duration display */}
      {isRecording && (
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <div className="text-3xl font-mono tabular-nums">
            {formatDuration(duration)}
          </div>
          <p className="text-sm text-muted-foreground">
            {duration < 600
              ? "Release to stop • Max 10 minutes"
              : "Maximum duration reached"}
          </p>
        </div>
      )}

      {/* Waveform visualization when recording */}
      {isRecording && (
        <div className="flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full wave-bar"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <p className="text-sm text-muted-foreground animate-fade-in">
          Processing your entry...
        </p>
      )}

      {/* Instructions */}
      {!isRecording && !isProcessing && (
        <div className="text-center">
          <p className="text-lg font-medium">Start speaking</p>
          <p className="text-sm text-muted-foreground mt-1">
            Press and hold, or tap to toggle
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive animate-fade-in">{error}</p>
      )}
    </div>
  );
}
