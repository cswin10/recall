"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, BarChart2, Settings, LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Timeline", icon: Home },
  { href: "/app/record", label: "Record", icon: Mic },
  { href: "/app/summaries", label: "Summaries", icon: BarChart2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/app" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline gradient-text">Tellit</span>
          </Link>

          {/* Navigation - desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:scale-105"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign out button - desktop */}
          <button
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-destructive/10 rounded-lg hover:scale-105"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="md:hidden flex items-center justify-around border-t border-primary/10 py-2 px-4 bg-background/95 backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs transition-all duration-200",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                isActive ? "bg-primary/10" : "hover:bg-secondary"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground active:scale-95 transition-transform"
        >
          <div className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
            <LogOut className="h-5 w-5" />
          </div>
          Sign out
        </button>
      </nav>
    </header>
  );
}
