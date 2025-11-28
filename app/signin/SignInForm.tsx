"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app";
  const urlError = searchParams.get("error");

  // Show URL error on mount
  useEffect(() => {
    if (urlError) {
      setMessage({ type: "error", text: urlError });
    }
  }, [urlError]);

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for a magic link!" });
    }
  };

  return (
    <Card className="w-full max-w-md card-interactive border-2">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
        </Link>
        <CardTitle className="text-2xl">
          Welcome to <span className="gradient-text">Tellit</span>
        </CardTitle>
        <CardDescription>Sign in to start your voice journal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Magic link form */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="h-12 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 btn-interactive btn-glow bg-gradient-to-r from-primary to-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Mail className="mr-2 h-5 w-5" />
            )}
            Send magic link
          </Button>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm text-center transition-all duration-300 ${
              message.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-accent/20 text-accent-foreground border border-accent/30"
            }`}
          >
            {message.type === "success" && <Sparkles className="inline h-4 w-4 mr-2 sparkle" />}
            {message.text}
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-xs text-center text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
