import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-background to-amber-50/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8 hover:bg-primary/10 transition-all duration-200 hover:scale-105">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-neutral max-w-none">
          {/* TL;DR */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 mb-8 not-prose border-2 border-primary/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              The Short Version
            </h2>
            <p className="text-lg font-medium mb-2">
              We can&apos;t read your journal. No one can.
            </p>
            <p className="text-muted-foreground">
              Your journal entries are encrypted before they&apos;re stored. We don&apos;t have admin tools
              to view your content. AI analysis happens within your session only. Your data belongs
              to you and can be exported or deleted at any time.
            </p>
          </div>

          {/* Encryption */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              How Your Data is Encrypted
            </h2>
            <p>
              When you record a journal entry, here&apos;s what happens:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-4">
              <li>Your audio is sent to OpenAI&apos;s Whisper API for transcription</li>
              <li>The transcript is encrypted using AES-256-GCM with your unique data key</li>
              <li>Your data key is itself encrypted (wrapped) with our master key</li>
              <li>Only the encrypted data is stored in our database</li>
              <li>Decryption only occurs server-side within your authenticated session</li>
            </ol>
            <p className="mt-4">
              This means even if our database were compromised, your journal entries would remain
              unreadable without both the master key (stored separately) and valid authentication.
            </p>
          </section>

          {/* What we collect */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              What We Store
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Encrypted transcripts</strong> - Your journal text, encrypted</li>
              <li><strong>Audio files</strong> - Optional, can be deleted after transcription</li>
              <li><strong>Metadata</strong> - Timestamps, sentiment analysis, tags (also encrypted where possible)</li>
              <li><strong>Account info</strong> - Email address for authentication</li>
              <li><strong>Embeddings</strong> - Vector representations for semantic search (cannot be reversed to text)</li>
            </ul>
          </section>

          {/* Third parties */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              Third-Party Services
            </h2>
            <h3 className="font-semibold mt-4">OpenAI</h3>
            <p>
              We use OpenAI&apos;s APIs for:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Audio transcription (Whisper)</li>
              <li>Entry analysis (sentiment, tags, mood)</li>
              <li>Summary generation</li>
              <li>Semantic search embeddings</li>
            </ul>
            <p className="mt-2">
              Per OpenAI&apos;s <a href="https://openai.com/policies/api-data-usage-policies" className="text-primary hover:underline">API data usage policy</a>,
              data sent to their API is not used to train their models and is retained for a maximum of 30 days
              for abuse monitoring purposes.
            </p>

            <h3 className="font-semibold mt-4">Supabase</h3>
            <p>
              We use Supabase for authentication and database hosting. All data is stored encrypted,
              and Supabase provides additional security through Row Level Security (RLS) policies
              that ensure users can only access their own data.
            </p>

            <h3 className="font-semibold mt-4">Vercel</h3>
            <p>
              Our application is hosted on Vercel. They process web requests but do not have
              access to your encrypted journal content.
            </p>
          </section>

          {/* Your rights */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Access</strong> - You can view all your data within the app</li>
              <li><strong>Export</strong> - Download your complete journal as Markdown/JSON at any time</li>
              <li><strong>Deletion</strong> - Delete individual entries or your entire account</li>
              <li><strong>Portability</strong> - Your exported data is in open formats you can use anywhere</li>
            </ul>
          </section>

          {/* No analytics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">What We Don&apos;t Do</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We don&apos;t analyze your journal content for advertising</li>
              <li>We don&apos;t sell your data to third parties</li>
              <li>We don&apos;t have admin tools to view decrypted content</li>
              <li>We don&apos;t track your behavior within the app for marketing</li>
              <li>We don&apos;t share your data with anyone except the services listed above</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p>
              If you have questions about this privacy policy or how your data is handled,
              please contact us at privacy@tellit.app.
            </p>
          </section>
        </div>

        <div className="border-t border-primary/10 pt-8 mt-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Return to Tellit
          </Link>
        </div>
      </div>
    </div>
  );
}
