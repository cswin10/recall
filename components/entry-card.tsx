"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getSentimentEmoji, getEnergyColor } from "@/lib/utils";
import type { EntryListItem } from "@/types";

interface EntryCardProps {
  entry: EntryListItem;
  onClick?: () => void;
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const date = new Date(entry.occurred_at);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/20",
        "active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with time and metadata */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {format(date, "h:mm a")}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(date, "MMM d")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {entry.sentiment && (
              <span className="text-lg" title={`Sentiment: ${entry.sentiment}`}>
                {getSentimentEmoji(entry.sentiment)}
              </span>
            )}
            {entry.energy && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  getEnergyColor(entry.energy)
                )}
                title={`Energy: ${entry.energy}/10`}
              >
                {entry.energy}
              </span>
            )}
          </div>
        </div>

        {/* Preview text */}
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
          {entry.preview}
        </p>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground"
              >
                {tag.name}
              </span>
            ))}
            {entry.tags.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{entry.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Mood indicator */}
        {entry.mood && (
          <p className="text-xs text-muted-foreground mt-2 capitalize">
            Mood: {entry.mood}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
