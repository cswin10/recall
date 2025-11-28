import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const redirect = requestUrl.searchParams.get("redirect") || "/app";
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Handle errors from Supabase
  if (error) {
    console.error("Auth callback error:", error, error_description);
    const errorUrl = new URL("/signin", requestUrl.origin);
    errorUrl.searchParams.set("error", error_description || error);
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();

  // Handle code exchange (OAuth flow)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      const errorUrl = new URL("/signin", requestUrl.origin);
      errorUrl.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Handle token hash (magic link / email OTP flow)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "invite" | "email" | "magiclink",
    });
    if (verifyError) {
      console.error("Token verification error:", verifyError);
      const errorUrl = new URL("/signin", requestUrl.origin);
      errorUrl.searchParams.set("error", verifyError.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Redirect to the app or the specified redirect path
  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
