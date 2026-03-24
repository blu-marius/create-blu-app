export const CONFIRM_ROUTE_TEMPLATE = `import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_OTP_TYPES = ["email", "recovery", "invite", "signup"] as const;
type OtpType = (typeof VALID_OTP_TYPES)[number];

// Handles email confirmation and password reset links from Supabase
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  // Validate OTP type at runtime
  const type: OtpType | null = VALID_OTP_TYPES.includes(rawType as OtpType)
    ? (rawType as OtpType)
    : null;

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Invalid+confirmation+link", request.url)
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Supabase+not+configured", request.url)
    );
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    console.error("OTP verification error:", error.message);
    return NextResponse.redirect(
      new URL("/auth/error?message=This+link+is+invalid+or+has+expired", request.url)
    );
  }

  // For password recovery, redirect to update-password page
  if (type === "recovery") {
    return NextResponse.redirect(
      new URL("/auth/update-password", request.url)
    );
  }

  // Prevent open redirect — only allow relative paths on the same origin
  const redirectUrl = new URL(next, request.url);
  if (redirectUrl.origin !== new URL(request.url).origin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(redirectUrl);
}
`;
