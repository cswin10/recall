import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins === 0) return "Just now";
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function groupEntriesByDate<T extends { occurred_at: string }>(
  entries: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);

  for (const entry of entries) {
    const entryDate = new Date(entry.occurred_at);
    const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

    let key: string;
    if (entryDay.getTime() === today.getTime()) {
      key = "Today";
    } else if (entryDay.getTime() === yesterday.getTime()) {
      key = "Yesterday";
    } else if (entryDay >= thisWeekStart) {
      key = "This Week";
    } else {
      key = "Older";
    }

    const existing = groups.get(key) || [];
    existing.push(entry);
    groups.set(key, existing);
  }

  return groups;
}

export function getSentimentEmoji(sentiment: string | null): string {
  switch (sentiment) {
    case "positive":
      return "😊";
    case "negative":
      return "😔";
    case "mixed":
      return "🤔";
    default:
      return "😐";
  }
}

export function getEnergyColor(energy: number | null): string {
  if (!energy) return "bg-gray-200";
  if (energy <= 3) return "bg-blue-200";
  if (energy <= 6) return "bg-yellow-200";
  return "bg-green-200";
}
