"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, RefreshCw, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, getSentimentEmoji, getEnergyColor } from "@/lib/utils";
import type { DecryptedEntry } from "@/types";

interface EntryDetailProps {
  entry: DecryptedEntry | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onRegenerateTags?: (id: string) => Promise<void>;
}

export function EntryDetail({
  entry,
  open,
  onClose,
  onDelete,
  onRegenerateTags,
}: EntryDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!entry) return null;

  const date = new Date(entry.occurred_at);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRegenerateTags = async () => {
    if (!onRegenerateTags) return;
    setIsRegenerating(true);
    try {
      await onRegenerateTags(entry.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">
                {format(date, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {format(date, "h:mm a")}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {entry.sentiment && (
                <span className="text-2xl" title={`Sentiment: ${entry.sentiment}`}>
                  {getSentimentEmoji(entry.sentiment)}
                </span>
              )}
              {entry.energy && (
                <span
                  className={cn(
                    "text-sm px-3 py-1 rounded-full font-medium",
                    getEnergyColor(entry.energy)
                  )}
                >
                  Energy: {entry.energy}/10
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Mood */}
        {entry.mood && (
          <p className="text-sm text-muted-foreground capitalize">
            Mood: <span className="font-medium">{entry.mood}</span>
          </p>
        )}

        {/* Full transcript */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {entry.text}
          </p>
        </div>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Tags</h4>
              {onRegenerateTags && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateTags}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Regenerate</span>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-sm px-3 py-1 bg-secondary rounded-full text-secondary-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          {showDeleteConfirm ? (
            <>
              <p className="text-sm text-muted-foreground mr-auto self-center">
                Are you sure? This cannot be undone.
              </p>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </>
          ) : (
            <>
              {onDelete && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
