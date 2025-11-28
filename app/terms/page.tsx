import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold gradient-text">Terms of Service</h1>
        </div>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-neutral max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Tellit (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Tellit is a voice-first journaling application that allows you to record audio
              entries, which are transcribed and stored securely. The Service includes features
              such as:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Voice recording and transcription</li>
              <li>AI-powered analysis (sentiment, tags, mood)</li>
              <li>Searchable journal timeline</li>
              <li>Automated daily, weekly, and monthly summaries</li>
              <li>Data export functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Your Account</h2>
            <p>
              You are responsible for maintaining the security of your account credentials.
              You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Provide accurate information when creating your account</li>
              <li>Keep your login credentials secure</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Your Content</h2>
            <p>
              You retain all rights to the content you create using Tellit. By using the Service,
              you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Store your encrypted content</li>
              <li>Process your content through third-party AI services for transcription and analysis</li>
              <li>Display your decrypted content back to you within the app</li>
            </ul>
            <p className="mt-2">
              We do not claim ownership of your content, and your journal entries remain private
              and encrypted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Distribute malware or harmful content</li>
              <li>Attempt to bypass security measures</li>
              <li>Use the Service for any commercial purpose without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Service Limitations</h2>
            <p>
              The Service has the following limitations:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Maximum recording duration of 10 minutes per entry</li>
              <li>AI transcription may not be 100% accurate</li>
              <li>Summaries and analysis are AI-generated and may contain errors</li>
              <li>Service availability is not guaranteed 24/7</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Third-Party Services</h2>
            <p>
              The Service uses third-party providers including:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>OpenAI for transcription and AI analysis</li>
              <li>Supabase for authentication and data storage</li>
              <li>Vercel for hosting</li>
            </ul>
            <p className="mt-2">
              Your use of these services is also subject to their respective terms and policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Data and Privacy</h2>
            <p>
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for information about how we collect, use, and protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
            <p>
              You may delete your account at any time. We may suspend or terminate your access
              to the Service if you violate these terms. Upon termination, your data will be
              deleted in accordance with our data retention policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
              GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY
              SECURE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE
              OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant
              changes by email or through the Service. Continued use of the Service after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contact</h2>
            <p>
              For questions about these terms, please contact us at legal@tellit.app.
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
