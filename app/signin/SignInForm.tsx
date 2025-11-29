"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/app";
  const urlError = searchParams.get("error");

  const supabase = createClient();

  // Show URL error on mount
  useEffect(() => {
    if (urlError) {
      setMessage({ type: "error", text: urlError });
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Validate passwords match for sign up
    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    // Validate password length
    if (isSignUp && password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    if (isSignUp) {
      // Sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      setIsLoading(false);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Account created! Check your email to confirm." });
      }
    } else {
      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setIsLoading(false);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        // Redirect on successful sign in
        router.push(redirect);
        router.refresh();
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
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
          {isSignUp ? "Create an account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isSignUp ? "Start your voice journal journey" : "Sign in to your voice journal"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
              className="h-12 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
                className="h-12 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 btn-interactive btn-glow bg-gradient-to-r from-primary to-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isSignUp ? (
              <UserPlus className="mr-2 h-5 w-5" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isSignUp ? "Create Account" : "Sign In"}
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

        {/* Toggle sign in / sign up */}
        <div className="text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? (
              <>Already have an account? <span className="font-medium text-primary">Sign in</span></>
            ) : (
              <>Don&apos;t have an account? <span className="font-medium text-primary">Sign up</span></>
            )}
          </button>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary transition-colors">
            Terms
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
