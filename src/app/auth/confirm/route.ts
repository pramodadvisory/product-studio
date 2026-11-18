import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * Where links in Supabase's emails land: confirming a new account, and
 * resetting a password. Turns the link into a signed-in session, then goes on
 * to `next` (for a reset, the page that sets the new password).
 *
 * Handles both link styles: `?code=` (Supabase's default templates) and
 * `?token_hash=&type=` (templates edited to link here directly, which also
 * work when the link is opened in a different browser).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const failed = new URL("/?error=link", request.url);

  // Supabase sends people back with an error when a link has expired or was used.
  if (searchParams.has("error")) return NextResponse.redirect(failed);

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(failed);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  return NextResponse.redirect(ok ? new URL(next, request.url) : failed);
}
