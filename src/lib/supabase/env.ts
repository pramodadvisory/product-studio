/**
 * Supabase connection settings, read from .env.local (and from the Cloudflare
 * build environment in production). Returns null instead of throwing, so the
 * app keeps working on localStorage when Supabase isn't configured.
 *
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…) is Supabase's current
 * name. The older NEXT_PUBLIC_SUPABASE_ANON_KEY still works as a fallback.
 * Each variable is read by its full name so Next.js can inline it into the
 * browser bundle.
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
