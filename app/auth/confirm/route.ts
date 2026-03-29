import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No token hash or type")}`
    );
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err: any) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(
        err?.message || "Confirmation failed"
      )}`
    );
  }
}