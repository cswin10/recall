"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { format, isToday, isYesterday, startOfWeek, isThisWeek, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/entry-card";
import { EntryDetail } from "@/components/entry-detail";
import { SearchBar } from "@/components/search-bar";
import type { EntryListItem, DecryptedEntry, SearchResult } from "@/types";

export default function TimelinePage() {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DecryptedEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [flashbackEntry, setFlashbackEntry] = useState<EntryListItem | null>(null);

  // Load entries
  const loadEntries = useCallback(async (cursorParam?: string) => {
    try {
      const url = new URL("/api/entries/list", window.location.origin);
      if (cursorParam) {
        url.searchParams.set("cursor", cursorParam);
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.data) {
        if (cursorParam) {
          setEntries((prev) => [...prev, ...data.data]);
        } else {
          setEntries(data.data);
        }
        setCursor(data.cursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load entries:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load "On This Day" flashback
  const loadFlashback = useCallback(async () => {
    try {
      const oneYearAgo = subDays(new Date(), 365);
      const url = new URL("/api/entries/list", window.location.origin);
      url.searchParams.set("cursor", oneYearAgo.toISOString());

      const res = await fetch(url);
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        // Find an entry from approximately one year ago
        const flashback = data.data.find((entry: EntryListItem) => {
          const entryDate = new Date(entry.occurred_at);
          const daysDiff = Math.abs(
            (new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24) - 365
          );
          return daysDiff < 7; // Within a week of exactly one year ago
        });
        if (flashback) {
          setFlashbackEntry(flashback);
        }
      }
    } catch (error) {
      console.error("Failed to load flashback:", error);
    }
  }, []);

  useEffect(() => {
    loadEntries();
    loadFlashback();
  }, [loadEntries, loadFlashback]);

  // Handle search
  const handleSearch = async (query: string, semantic: boolean) => {
    setIsSearching(true);
    try {
      if (semantic) {
        const res = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 20 }),
        });
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        // Keyword search uses the list endpoint
        const url = new URL("/api/entries/list", window.location.origin);
        url.searchParams.set("keyword", query);
        const res = await fetch(url);
        const data = await res.json();
        // Convert to search result format
        setSearchResults(
          (data.data || []).map((e: EntryListItem) => ({
            id: e.id,
            snippet: e.preview,
            occurred_at: e.occurred_at,
            similarity: 1,
          }))
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchResults(null);
  };

  // Load entry detail
  const handleEntryClick = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`);
      const data = await res.json();
      if (data.id) {
        setSelectedEntry(data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error("Failed to load entry:", error);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`/api/entries/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  // Load more
  const handleLoadMore = () => {
    if (cursor && hasMore) {
      loadEntries(cursor);
    }
  };

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = new Date(entry.occurred_at);
    let key: string;

    if (isToday(date)) {
      key = "Today";
    } else if (isYesterday(date)) {
      key = "Yesterday";
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      key = "This Week";
    } else {
      key = format(date, "MMMM yyyy");
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, EntryListItem[]>);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isSearching={isSearching}
      />

      {/* Flashback card */}
      {flashbackEntry && !searchResults && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-medium text-purple-700">On This Day</h3>
            <span className="text-xs text-purple-500">
              {format(new Date(flashbackEntry.occurred_at), "MMMM d, yyyy")}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{flashbackEntry.preview}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-purple-600 hover:text-purple-700"
            onClick={() => handleEntryClick(flashbackEntry.id)}
          >
            View entry →
          </Button>
        </div>
      )}

      {/* Search results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Search Results ({searchResults.length})
            </h2>
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              Clear
            </Button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No results found. Try a different search term.
            </p>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleEntryClick(result.id)}
                >
                  <p className="text-sm text-muted-foreground mb-1">
                    {format(new Date(result.occurred_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p className="text-sm">{result.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {!searchResults && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Your journal is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start by recording your first entry
              </p>
              <Link href="/app/record">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Entry
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEntries).map(([group, groupEntries]) => (
                <div key={group}>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {group}
                  </h2>
                  <div className="space-y-3">
                    {groupEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onClick={() => handleEntryClick(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Floating action button (mobile) */}
      <Link
        href="/app/record"
        className="fixed bottom-20 right-4 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* Entry detail modal */}
      <EntryDetail
        entry={selectedEntry}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}
