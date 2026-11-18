import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Runs before every page and API request:
 * - refreshes the Supabase session, so its cookie stays current (Server
 *   Components can read cookies but can't write them);
 * - sends anyone who isn't signed in to the sign-in page, and anyone who is
 *   away from the sign-in pages.
 *
 * This is the first line, not the only one: the database's access rules are
 * what actually keep each project to the people on it.
 *
 * When Supabase isn't configured the app runs on this browser's storage alone,
 * with no sign-in, as it did before.
 */

/** Sign-in pages. Signed-in people are sent on to their projects. */
const SIGN_IN_PAGES = ["/", "/signup", "/forgot-password"];

/** Open to everyone: email-link landing, and published projects. */
const OPEN_PREFIXES = ["/auth/", "/p/"];

export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Verifies the token (not just reads the cookie). Nothing may run between
  // creating the client and this call, or sessions can drop at random.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, searchParams } = request.nextUrl;

  /** A redirect that keeps any refreshed session cookie. */
  const redirect = (url: URL) => {
    const to = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) to.cookies.set(cookie);
    return to;
  };

  // An email link that fell back to the Site URL (its redirect wasn't on
  // Supabase's allow list) arrives here with its code: finish it properly.
  if (pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return redirect(url);
  }

  if (OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return response;

  if (SIGN_IN_PAGES.includes(pathname)) {
    if (!signedIn) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    return redirect(url);
  }

  if (signedIn) return response;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("next", pathname + request.nextUrl.search);
  return redirect(url);
}

export const config = {
  matcher: [
    // Everything except Next's own files and static images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
