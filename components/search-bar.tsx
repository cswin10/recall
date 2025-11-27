"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string, semantic: boolean) => Promise<void>;
  onClear: () => void;
  isSearching?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onClear,
  isSearching = false,
  placeholder = "Search your journal...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSemanticMode, setIsSemanticMode] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        await onSearch(query.trim(), isSemanticMode);
      }
    },
    [query, isSemanticMode, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onClear();
  }, [onClear]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            disabled={isSearching}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Semantic toggle */}
        <Button
          type="button"
          variant={isSemanticMode ? "default" : "outline"}
          size="icon"
          onClick={() => setIsSemanticMode(!isSemanticMode)}
          title={isSemanticMode ? "Semantic search on" : "Keyword search"}
          disabled={isSearching}
        >
          <Sparkles className={cn("h-4 w-4", isSemanticMode && "text-yellow-300")} />
        </Button>

        {/* Search button */}
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Mode indicator */}
      <p className="text-xs text-muted-foreground mt-2">
        {isSemanticMode
          ? "Semantic search: finds entries by meaning"
          : "Keyword search: exact text match"}
      </p>
    </form>
  );
}
