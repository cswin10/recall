import Link from "next/link";
import { ArrowRight, Shield, Lock, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-background to-amber-50/30">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl gradient-text">Tellit</span>
          </div>
          <Link href="/signin">
            <Button variant="ghost" className="hover:bg-primary/10 transition-all duration-200 hover:scale-105">
              Sign in
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-8 float">
            <Sparkles className="h-4 w-4 sparkle" />
            Your thoughts, beautifully organized
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Speak your thoughts.
            <br />
            <span className="gradient-text">Tell your story.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A voice journal that transforms your spoken words into a searchable timeline
            with AI-powered insights and summaries. Private by design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="w-full sm:w-auto btn-interactive btn-glow bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25">
                Start speaking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/privacy">
              <Button size="lg" variant="outline" className="w-full sm:w-auto btn-interactive border-2 hover:border-primary/50 hover:bg-primary/5">
                Learn about privacy
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-primary/20 card-interactive">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 icon-bounce">
              <Mic className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-lg">Voice-First</h3>
            <p className="text-sm text-muted-foreground">
              Press and hold to record. Your thoughts are transcribed instantly and stored securely.
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-accent/30 card-interactive">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center mx-auto mb-4 icon-bounce">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2 text-lg">End-to-End Encrypted</h3>
            <p className="text-sm text-muted-foreground">
              Your journal entries are encrypted. We can&apos;t read your thoughts. No one can.
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-transparent hover:border-primary/20 card-interactive">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-4 icon-bounce">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-lg">Smart Summaries</h3>
            <p className="text-sm text-muted-foreground">
              Daily, weekly, and monthly summaries help you see patterns and remember what matters.
            </p>
          </div>
        </div>

        {/* Privacy callout */}
        <div className="mt-24 max-w-2xl mx-auto text-center bg-gradient-to-br from-sky-100/50 to-amber-100/30 rounded-3xl p-8 border-2 border-primary/10 card-interactive">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/30 mb-4">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            We can&apos;t read your journal. Period.
          </h2>
          <p className="text-muted-foreground mb-4">
            Your transcripts are encrypted with your own key before storage. Even we don&apos;t have
            access to your private thoughts. AI analysis happens server-side under your session only,
            and summaries are encrypted too.
          </p>
          <Link href="/privacy" className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors group">
            Read our privacy policy
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-primary/10 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p>© {new Date().getFullYear()} Tellit. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
