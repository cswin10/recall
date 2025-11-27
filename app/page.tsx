import Link from "next/link";
import { ArrowRight, Shield, Lock, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">R</span>
            </div>
            <span className="font-bold text-xl">Recall</span>
          </div>
          <Link href="/signin">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Speak your thoughts.
            <br />
            <span className="text-primary">Recall your life.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A speech-first journal that transforms your voice notes into a searchable timeline
            with AI-powered insights and summaries. Private by design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="w-full sm:w-auto">
                Start speaking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/privacy">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn about privacy
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Voice-First</h3>
            <p className="text-sm text-muted-foreground">
              Press and hold to record. Your thoughts are transcribed instantly and stored securely.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">End-to-End Encrypted</h3>
            <p className="text-sm text-muted-foreground">
              Your journal entries are encrypted. We can&apos;t read your thoughts. No one can.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Smart Summaries</h3>
            <p className="text-sm text-muted-foreground">
              Daily, weekly, and monthly summaries help you see patterns and remember what matters.
            </p>
          </div>
        </div>

        {/* Privacy callout */}
        <div className="mt-24 max-w-2xl mx-auto text-center bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            We can&apos;t read your journal. Period.
          </h2>
          <p className="text-muted-foreground mb-4">
            Your transcripts are encrypted with your own key before storage. Even we don&apos;t have
            access to your private thoughts. AI analysis happens server-side under your session only,
            and summaries are encrypted too.
          </p>
          <Link href="/privacy" className="text-primary hover:underline text-sm">
            Read our privacy policy →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Recall. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
