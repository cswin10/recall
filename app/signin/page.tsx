import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SignInForm from "./SignInForm";

function SignInLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">R</span>
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome to Recall</CardTitle>
        <CardDescription>Sign in to start your voice journal</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Suspense fallback={<SignInLoading />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
